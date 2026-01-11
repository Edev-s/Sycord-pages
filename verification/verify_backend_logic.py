# This script simulates the backend logic for parsing the logs
import re

logs = [
    "2026-01-11 18:12:57,792 [INFO] [618721121] ",
    " ⛅️ wrangler 4.58.0",
    "───────────────────",
    "Uploading... (4/4)",
    "✨ Success! Uploaded 0 files (4 already uploaded) (0.56 sec)",
    "",
    "🌎 Deploying...",
    "✨ Deployment complete! Take a peek over at https://ca971c36.test-bdc.pages.dev",
    "2026-01-11 18:12:57,801 [INFO] [618721121] Cleaned up temporary directory"
]

combined_logs = "\n".join(logs)
match = re.search(r"Take a peek over at\s+(https://[^\s]+)", combined_logs)

if match:
    domain = match.group(1).strip()
    if domain.endswith('.'):
        domain = domain[:-1]
    print(f"SUCCESS: Extracted domain: {domain}")
    if domain == "https://ca971c36.test-bdc.pages.dev":
        print("VERIFIED: Domain matches expected value.")
    else:
        print("FAILED: Domain mismatch.")
else:
    print("FAILED: Could not extract domain.")
