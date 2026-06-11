import os
import io
import datetime
import pandas as pd
import boto3
import requests
import pendulum
from sqlalchemy import create_engine, text
from airflow.decorators import dag, task
from airflow.exceptions import AirflowException
from airflow.models import Variable

# --- CONFIGURATION ---
S3_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
S3_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
BUCKET_NAME = "govt-data"

PG_CONN_URI = os.getenv("POSTGRES_URI", "postgresql://safecred:password@postgres:5432/safecred")

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name='us-east-1'
    )

def upload_df_to_parquet(df: pd.DataFrame, dataset_name: str, ds: str) -> str:
    """Saves DataFrame as Snappy compressed Parquet to MinIO and returns the S3 URI."""
    s3_client = get_s3_client()
    
    # Ensure bucket exists
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
    except BaseException:
        s3_client.create_bucket(Bucket=BUCKET_NAME)
        
    object_key = f"raw/{dataset_name}/{ds}/data.parquet"
    
    parquet_buffer = io.BytesIO()
    df.to_parquet(parquet_buffer, engine='pyarrow', compression='snappy', index=False)
    
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=object_key,
        Body=parquet_buffer.getvalue()
    )
    
    return f"s3://{BUCKET_NAME}/{object_key}"

def download_parquet_to_df(s3_uri: str) -> pd.DataFrame:
    """Reads Parquet from MinIO S3 URI back into a DataFrame."""
    s3_client = get_s3_client()
    # URI format: s3://bucket/key/path
    parts = s3_uri.replace("s3://", "").split("/", 1)
    bucket = parts[0]
    key = parts[1]
    
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    return pd.read_parquet(io.BytesIO(obj['Body'].read()), engine='pyarrow')

def send_slack_alert(context):
    """Callback for DAG failure."""
    webhook_url = Variable.get("SLACK_WEBHOOK_URL", default_var=None)
    if not webhook_url:
        print("Slack webhook URL not found in Airflow Variables. Skipping alert.")
        return
        
    task_instance = context.get("task_instance")
    task_id = task_instance.task_id
    execution_date = context.get("execution_date")
    exception = context.get("exception")
    
    payload = {
        "text": f"🚨 *Airflow DAG Failure* 🚨\n*Task*: {task_id}\n*Date*: {execution_date}\n*Error*: {exception}"
    }
    requests.post(webhook_url, json=payload)

# --- DAG DEFINITION ---
@dag(
    dag_id='govt_data_sync_dag',
    schedule='0 2 * * *',
    start_date=pendulum.datetime(2023, 1, 1, tz='Asia/Kolkata'),
    catchup=False,
    on_failure_callback=send_slack_alert,
    tags=['etl', 'govt_data', 'safecred']
)
def govt_data_sync():
    
    @task
    def fetch_secc(**context) -> dict:
        ds = context['ds']
        print(f"Fetching SECC data for {ds}")
        # MOCK API FETCH
        data = {
            "district_code": ["D001", "D002", "D003"],
            "deprivation_score": [3.2, 1.5, 4.0],
            "kaccha_house_pct": [12.5, 5.0, 25.0]
        }
        df = pd.DataFrame(data)
        
        uri = upload_df_to_parquet(df, "secc", ds)
        return {
            "dataset": "secc",
            "uri": uri,
            "row_count": len(df),
            "ingested_at": datetime.datetime.utcnow().isoformat()
        }

    @task
    def fetch_nss(**context) -> dict:
        ds = context['ds']
        print(f"Fetching NSS data for {ds}")
        # MOCK API FETCH
        data = {
            "district_code": ["D001", "D002", "D003"],
            "avg_consumption_inr": [4500.0, 8000.0, 3200.0]
        }
        df = pd.DataFrame(data)
        
        uri = upload_df_to_parquet(df, "nss", ds)
        return {
            "dataset": "nss",
            "uri": uri,
            "row_count": len(df),
            "ingested_at": datetime.datetime.utcnow().isoformat()
        }

    @task
    def fetch_pmgdisha(**context) -> dict:
        ds = context['ds']
        print(f"Fetching PMGDISHA data for {ds}")
        # MOCK API FETCH
        data = {
            "district_code": ["D001", "D002", "D003"],
            "digital_literacy_pct": [65.0, 85.0, 40.0]
        }
        df = pd.DataFrame(data)
        
        uri = upload_df_to_parquet(df, "pmgdisha", ds)
        return {
            "dataset": "pmgdisha",
            "uri": uri,
            "row_count": len(df),
            "ingested_at": datetime.datetime.utcnow().isoformat()
        }

    @task
    def merge_and_store(secc_meta: dict, nss_meta: dict, pmgdisha_meta: dict, **context):
        ds = context['ds']
        
        # 1. Download Parquets from MinIO URIs
        secc_df = download_parquet_to_df(secc_meta["uri"])
        nss_df = download_parquet_to_df(nss_meta["uri"])
        pmgdisha_df = download_parquet_to_df(pmgdisha_meta["uri"])
        
        # 2. Merge DataFrames
        merged_df = pd.merge(secc_df, nss_df, on="district_code", how="outer")
        merged_df = pd.merge(merged_df, pmgdisha_df, on="district_code", how="outer")
        
        # 3. Data Quality Validation
        if len(merged_df) == 0:
            raise AirflowException("Validation Failed: Row count is 0")
            
        required_cols = ["district_code", "deprivation_score", "avg_consumption_inr", "digital_literacy_pct"]
        missing_cols = [col for col in required_cols if col not in merged_df.columns]
        if missing_cols:
            raise AirflowException(f"Validation Failed: Missing required columns {missing_cols}")
            
        if merged_df["district_code"].duplicated().any():
            raise AirflowException("Validation Failed: Duplicate district_codes detected")
            
        null_rate = merged_df.isnull().sum().sum() / (merged_df.shape[0] * merged_df.shape[1])
        if null_rate > 0.05:
            raise AirflowException(f"Validation Failed: Null percentage {null_rate:.2%} exceeds 5% threshold")
            
        # 4. Upsert to PostgreSQL
        engine = create_engine(PG_CONN_URI)
        
        with engine.begin() as conn:
            # Simple upsert using temp table (compatible with most PG setups)
            merged_df.to_sql("temp_socioeconomic_indices", conn, if_exists="replace", index=False)
            
            upsert_query = text("""
                INSERT INTO socioeconomic_indices (district_code, deprivation_score, kaccha_house_pct, avg_consumption_inr, digital_literacy_pct)
                SELECT district_code, deprivation_score, kaccha_house_pct, avg_consumption_inr, digital_literacy_pct FROM temp_socioeconomic_indices
                ON CONFLICT (district_code) DO UPDATE SET
                    deprivation_score = EXCLUDED.deprivation_score,
                    kaccha_house_pct = EXCLUDED.kaccha_house_pct,
                    avg_consumption_inr = EXCLUDED.avg_consumption_inr,
                    digital_literacy_pct = EXCLUDED.digital_literacy_pct;
            """)
            conn.execute(upsert_query)
            
        print(f"Successfully validated and upserted {len(merged_df)} rows for {ds}")

    # DAG Dependency Definition
    secc_meta = fetch_secc()
    nss_meta = fetch_nss()
    pmgdisha_meta = fetch_pmgdisha()
    
    merge_and_store(secc_meta, nss_meta, pmgdisha_meta)

# Instantiate the DAG
dag_instance = govt_data_sync()
