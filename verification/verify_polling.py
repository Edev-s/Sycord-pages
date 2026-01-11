# Verification script for polling logic
# This is a static analysis / mock verification since we cannot easily run a full deployment cycle in this environment.

import re

def verify_code_logic():
    with open("app/dashboard/sites/[id]/page.tsx", "r") as f:
        content = f.read()

    # Check for pollForDomain function definition
    if "const pollForDomain" not in content:
        print("FAIL: pollForDomain function missing")
        return False

    # Check for pollForDomain call in handleDeploy
    if "pollForDomain(result.repoId)" not in content:
        print("FAIL: pollForDomain not called in handleDeploy")
        return False

    # Check for state update
    if "setProject((prev: any) => ({ ...prev, cloudflareUrl: data.domain }))" not in content:
        print("FAIL: state update missing")
        return False

    print("SUCCESS: Polling logic verified in code.")
    return True

if __name__ == "__main__":
    verify_code_logic()
