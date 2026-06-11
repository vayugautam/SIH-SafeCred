from tenacity import retry, stop_after_attempt, wait_exponential
import structlog
import asyncio

logger = structlog.get_logger()

class GovtDataFetcher:
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch_secc(self, aadhaar_hash: str):
        logger.info("fetching_secc_data", aadhaar_hash=aadhaar_hash)
        await asyncio.sleep(1.5)
        return {"deprivation_score": 3, "housing_type": "Kutcha"}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch_nss_survey(self, district_code: str):
        logger.info("fetching_nss_survey", district_code=district_code)
        await asyncio.sleep(1)
        return {"average_income_band": "LIG", "employment_rate": 0.65}
