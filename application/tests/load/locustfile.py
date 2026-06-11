from locust import HttpUser, task, between

class SafeCredLoadTest(HttpUser):
    wait_time = between(1, 2)

    @task(3)
    def test_scoring_endpoint(self):
        # Mocks a 1000 concurrent user barrage against the ML inference service
        with self.client.get("/api/v1/score/BEN_LOAD_123", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 429:
                response.failure("Rate limited")
            else:
                response.failure(f"Failed with {response.status_code}")

    @task(1)
    def test_bulk_ingestion(self):
        payload = {
            "channel_partner_id": "PARTNER_1",
            "records": [{"amount": 500, "type": "MOBILE_RECHARGE", "beneficiary_id": f"BEN_LOAD_{i}"} for i in range(100)]
        }
        self.client.post("/api/v1/ingest/channel-partner", json=payload)
