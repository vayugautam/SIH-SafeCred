import numpy as np

class PolicySimulator:
    def __init__(self, pd_array, ead_array, lgd=0.5):
        self.pd_array = np.array(pd_array)
        self.ead_array = np.array(ead_array)
        self.lgd = lgd
        
    def simulate_threshold(self, approval_threshold):
        """
        approval_threshold: maximum acceptable PD.
        If PD <= threshold, approve. Else reject.
        """
        approved_mask = self.pd_array <= approval_threshold
        
        num_approved = approved_mask.sum()
        approval_rate = num_approved / len(self.pd_array) if len(self.pd_array) > 0 else 0
        
        expected_defaults = self.pd_array[approved_mask].sum()
        expected_default_rate = expected_defaults / num_approved if num_approved > 0 else 0
        
        expected_loss = (self.pd_array[approved_mask] * self.lgd * self.ead_array[approved_mask]).sum()
        
        return {
            "threshold_pd": approval_threshold,
            "approval_rate": round(approval_rate, 3),
            "expected_default_rate": round(expected_default_rate, 3),
            "total_expected_loss": round(expected_loss, 2)
        }
        
    def generate_curve(self, thresholds=[0.05, 0.1, 0.15, 0.2, 0.3]):
        return [self.simulate_threshold(t) for t in thresholds]
