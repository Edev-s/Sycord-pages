# Verify that the logic for generic domains is in place

def verify_code(filepath, search_strings):
    with open(filepath, 'r') as f:
        content = f.read()

    for s in search_strings:
        if s not in content:
            print(f"FAIL: Missing '{s}' in {filepath}")
            return False
    print(f"PASS: Verified {filepath}")
    return True

# 1. API Route
verify_code(
    "app/api/deploy/route.ts",
    [
        'if (domainData.domain === "https://test.pages.dev")',
        'const logDomain = await checkLogsForDomain(repoId)'
    ]
)

# 2. Domain Route
verify_code(
    "app/api/deploy/[repoId]/domain/route.ts",
    [
        'if (!domain || domain === "https://test.pages.dev")'
    ]
)

# 3. Frontend (Verify removal)
with open("app/dashboard/sites/[id]/page.tsx", 'r') as f:
    content = f.read()
    if 'if (result.url && result.url.includes(\'test.pages.dev\'))' in content:
        print("FAIL: Frontend check still exists!")
    else:
        print("PASS: Frontend check removed.")
