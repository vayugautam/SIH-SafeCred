from locust import HttpUser, task, between, LoadTestShape
import random
import json

# =========================================================================
# STAGED LOCUST LOAD TEST
# =========================================================================

class SafeCredLoadTester(HttpUser):
    # Simulate users taking 1 to 3 seconds between actions
    wait_time = between(1, 3)

    def on_start(self):
        """Executed once per simulated user before tasks begin."""
        # Authenticate and grab a token (mocked for load test environments)
        self.headers = {"Authorization": "Bearer LOAD_TEST_MOCK_TOKEN"}
        
    @task(3)
    def fetch_beneficiary_score(self):
        """Simulates an admin viewing a beneficiary's risk profile."""
        # Randomly select a beneficiary ID (assumes DB was seeded with BEN-0 to BEN-10000)
        bid = f"BEN-{random.randint(0, 10000)}"
        
        with self.client.get(f"/api/v1/score/{bid}", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                # 404s during load tests usually mean the random seed missed, which is fine
                response.success()
            else:
                response.failure(f"Failed with {response.status_code}: {response.text}")

    @task(1)
    def ingest_bulk_partner_data(self):
        """Simulates the massive CSV ingestion endpoint."""
        # Construct a synthetic bulk payload
        payload = {
            "records": [
                {"id": f"EXT-{i}", "amount": random.randint(100, 5000)} for i in range(50)
            ]
        }
        self.client.post("/api/v1/ingest/channel-partner", headers=self.headers, json=payload)


class StagedLoadShape(LoadTestShape):
    """
    Defines a custom staging pattern matching the approved requirements:
    50 -> 100 -> 250 -> 500 -> 1000 concurrent users.
    """
    
    stages = [
        {"duration": 60, "users": 50, "spawn_rate": 5},      # Minute 1: 50 users
        {"duration": 120, "users": 100, "spawn_rate": 10},   # Minute 2: 100 users
        {"duration": 240, "users": 250, "spawn_rate": 20},   # Minute 4: 250 users
        {"duration": 360, "users": 500, "spawn_rate": 20},   # Minute 6: 500 users
        {"duration": 600, "users": 1000, "spawn_rate": 50},  # Minute 10: 1000 users max load
    ]

    def tick(self):
        run_time = self.get_run_time()

        for stage in self.stages:
            if run_time < stage["duration"]:
                tick_data = (stage["users"], stage["spawn_rate"])
                return tick_data

        return None
