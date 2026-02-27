# Verify that the limits have been increased as requested

def check_file_content(filepath, search_str, expected_str):
    with open(filepath, 'r') as f:
        content = f.read()

    if search_str in content:
        print(f"PASS: Found '{search_str}' in {filepath}")
        return True
    else:
        print(f"FAIL: Could not find '{search_str}' in {filepath}")
        return False

# 1. Verify Auto-Fix Iterations (15)
check_file_content(
    "components/ai-website-builder.tsx",
    "if (iteration >= 15) {",
    "Expected iteration check >= 15"
)

# 2. Verify Domain Polling Attempts (40)
check_file_content(
    "app/dashboard/sites/[id]/page.tsx",
    "if (attempts >= 40) return",
    "Expected attempt check >= 40"
)
