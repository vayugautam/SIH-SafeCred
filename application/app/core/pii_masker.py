from typing import Any

PII_FIELDS = ["aadhaar_number", "aadhaar_hash", "mobile_number", "phone", "bank_account", "account_number"]

def mask_aadhaar(x: str) -> str:
    x = str(x).replace("-", "").replace(" ", "")
    if len(x) < 4: return "XXXX"
    return f"XXXX-XXXX-{x[-4:]}"

def mask_mobile(x: str) -> str:
    x = str(x).replace("-", "").replace(" ", "")
    if len(x) < 5: return "XXXXX"
    return f"XXXXX{x[-5:]}"

def mask_bank(x: str) -> str:
    x = str(x)
    if len(x) < 4: return "XXXX"
    return f"XXXX{x[-4:]}"

def mask_payload(data: Any) -> Any:
    """Recursively traverses a JSON dict/list and masks matching PII_FIELDS keys."""
    if isinstance(data, dict):
        new_data = {}
        for k, v in data.items():
            if k in PII_FIELDS and isinstance(v, str):
                if "aadhaar" in k.lower():
                    new_data[k] = mask_aadhaar(v)
                elif "mobile" in k.lower() or "phone" in k.lower():
                    new_data[k] = mask_mobile(v)
                elif "bank" in k.lower() or "account" in k.lower():
                    new_data[k] = mask_bank(v)
                else:
                    new_data[k] = "****"
            else:
                new_data[k] = mask_payload(v)
        return new_data
    elif isinstance(data, list):
        return [mask_payload(item) for item in data]
    return data
