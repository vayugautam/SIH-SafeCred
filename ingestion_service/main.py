from fastapi import FastAPI, File, UploadFile, BackgroundTasks
import structlog
import uuid
import hashlib
from typing import Dict

from ingestion_service.validators.schema import JobResult
from ingestion_service.provenance.logger import init_db, ProvenanceLogger
from ingestion_service.connectors.channel_partner import ChannelPartnerConnector
from ingestion_service.connectors.beneficiary_upload import BeneficiaryUploadParser

# Configure structlog
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

app = FastAPI(title="Ingestion Service", version="1.0.0")

# In-memory store for job statuses (in production, use Redis)
jobs: Dict[str, JobResult] = {}

@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("application_startup", status="success")

async def process_channel_partner(job_id: str, partner_id: str):
    logger.info("processing_channel_partner_job", job_id=job_id, partner_id=partner_id)
    connector = ChannelPartnerConnector()
    try:
        loans = await connector.fetch_loans(partner_id)
        repayments = await connector.fetch_repayments(partner_id)
        
        # Log Provenance
        for loan in loans:
            record_hash = hashlib.sha256(str(loan).encode()).hexdigest()
            await ProvenanceLogger.log_record(source=f"partner_{partner_id}", record_hash=record_hash)
            
        jobs[job_id].status = "completed"
        jobs[job_id].records_processed = len(loans) + len(repayments)
        logger.info("channel_partner_job_complete", job_id=job_id, records=jobs[job_id].records_processed)
    except Exception as e:
        jobs[job_id].status = "failed"
        jobs[job_id].errors.append(str(e))
        logger.error("channel_partner_job_failed", job_id=job_id, error=str(e))

@app.post("/ingest/channel-partner", response_model=JobResult)
async def ingest_channel_partner(partner_id: str, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    logger.info("ingest_channel_partner_started", job_id=job_id, partner_id=partner_id)
    
    result = JobResult(job_id=job_id, status="processing")
    jobs[job_id] = result
    
    background_tasks.add_task(process_channel_partner, job_id, partner_id)
    return result

async def process_upload(job_id: str, file: UploadFile):
    logger.info("processing_upload_job", job_id=job_id, filename=file.filename)
    parser = BeneficiaryUploadParser()
    try:
        record = await parser.parse_electricity_bill(file)
        
        # Log Provenance
        record_hash = hashlib.sha256(str(record).encode()).hexdigest()
        await ProvenanceLogger.log_record(source="manual_upload", record_hash=record_hash)
        
        jobs[job_id].status = "completed"
        jobs[job_id].records_processed = 1
        logger.info("upload_job_complete", job_id=job_id)
    except Exception as e:
        jobs[job_id].status = "failed"
        jobs[job_id].errors.append(str(e))
        logger.error("upload_job_failed", job_id=job_id, error=str(e))

@app.post("/ingest/upload", response_model=JobResult)
async def ingest_upload(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    logger.info("ingest_upload_started", job_id=job_id, filename=file.filename)
    
    result = JobResult(job_id=job_id, status="processing")
    jobs[job_id] = result
    
    background_tasks.add_task(process_upload, job_id, file)
    return result

@app.get("/ingest/status/{job_id}", response_model=JobResult)
async def get_status(job_id: str):
    logger.info("get_status_requested", job_id=job_id)
    if job_id in jobs:
        return jobs[job_id]
    return JobResult(job_id=job_id, status="not_found", errors=["Job not found"])
