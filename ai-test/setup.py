#!/usr/bin/env python3
import subprocess
import os
import sys

# Change to the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

print("Setting up AI Gateway test project...")
print(f"Working directory: {script_dir}\n")

# Check if package.json exists
if not os.path.exists('package.json'):
    print("Error: package.json not found!")
    sys.exit(1)

# Install dependencies
print("Installing dependencies...\n")
result = subprocess.run(['npm', 'install'], capture_output=False)
if result.returncode != 0:
    print("Error installing dependencies")
    sys.exit(1)

# Run the test
print("\n\nRunning AI Gateway test...\n")
result = subprocess.run(['npx', 'tsx', 'src/index.ts'], capture_output=False)
if result.returncode != 0:
    print("Error running test")
    sys.exit(1)

print("\nTest completed!")
