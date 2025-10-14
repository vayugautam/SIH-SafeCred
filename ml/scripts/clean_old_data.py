import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"

# subfolders inside /data
folders_to_clean = [
    "bank_statements",
    "recharge",
    "electricity",
    "education_fees",
]

# CSVs to remove
files_to_clean = [
    "applications.csv",
    "labels.csv",
    "loan_history.csv",
]

print(f"🧹 Cleaning old synthetic data in {DATA_DIR}...")

# Remove subfolder contents
for folder in folders_to_clean:
    folder_path = DATA_DIR / folder
    if folder_path.exists():
        shutil.rmtree(folder_path)  # delete folder and all its contents
        folder_path.mkdir(parents=True, exist_ok=True)  # recreate empty folder
        print(f"✅ Cleared folder: {folder}")

# Remove old CSV files
for filename in files_to_clean:
    file_path = DATA_DIR / filename
    if file_path.exists():
        file_path.unlink()
        print(f"✅ Deleted: {filename}")

print("✨ Cleanup complete! Now ready to generate fresh data.")
