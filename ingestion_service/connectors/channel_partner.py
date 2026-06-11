from tenacity import retry, stop_after_attempt, wait_exponential
import structlog
import asyncio

logger = structlog.get_logger()

class ChannelPartnerConnector:
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch_loans(self, partner_id: str):
        logger.info("fetching_loans_from_partner", partner_id=partner_id)
        # Mocking network call
        await asyncio.sleep(1)
        # Simulated failure for demonstration of retry
        # if random.random() < 0.3: raise ConnectionError("Partner API down")
        return [{"loan_id": "L123", "amount": 50000.0, "status": "active"}]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch_repayments(self, partner_id: str):
        logger.info("fetching_repayments_from_partner", partner_id=partner_id)
        await asyncio.sleep(1)
        return [{"loan_id": "L123", "amount_paid": 5000.0, "payment_method": "UPI"}]
