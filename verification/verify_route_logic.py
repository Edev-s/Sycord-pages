import re

# Mock log data
logs_success = [
    "2026-01-11 18:12:57,792 [INFO] Uploading...",
    "✨ Deployment complete! Take a peek over at https://ca971c36.test-bdc.pages.dev",
    "Cleaned up temporary directory"
]

def check_logs(logs):
    combined = "\n".join(logs)
    match = re.search(r"Take a peek over at\s+(https://[^\s]+)", combined)
    if match:
        return match.group(1).strip()
    return None

domain = check_logs(logs_success)
if domain == "https://ca971c36.test-bdc.pages.dev":
    print("SUCCESS: Domain extracted correctly")
else:
    print(f"FAILURE: Extracted {domain}")
