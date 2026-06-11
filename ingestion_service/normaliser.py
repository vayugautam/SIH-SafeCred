import re
from datetime import datetime

class DataNormaliser:
    @staticmethod
    def normalise_currency(value_str: str) -> float:
        """
        Removes currency symbols and commas, returns float.
        """
        if not value_str:
            return 0.0
        cleaned = re.sub(r'[^\d.]', '', value_str)
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    @staticmethod
    def normalise_dates(date_str: str) -> datetime:
        """
        Attempts to parse various date formats into standard datetime.
        """
        formats = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ"
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        raise ValueError(f"Could not parse date: {date_str}")
