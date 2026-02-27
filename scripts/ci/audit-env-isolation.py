#!/usr/bin/env python3
"""
Cross-Environment Isolation Auditor
====================================
Detects production resource IDs appearing in non-production environment blocks.

Exit Codes:
    0 - No leaks detected
    1 - Production IDs found in non-production blocks (CRITICAL)
    2 - Script error
"""

import json
import re
import sys
from pathlib import Path

# PRODUCTION BLACKLIST - These IDs must NEVER appear in staging/preview/dev blocks
PRODUCTION_BLACKLIST = {
    "34bce593-9df9-4acf-ac40-c8d93a7c7244": "D1:foundation-primary",
    "ef2305fbf6da4cffa948193efd40f40c": "KV:CACHE_KV",
    "1e179df285ba4817b905633ce55d6d98": "KV:RATE_LIMIT_KV",
    "c53d7df2c22c43f590f960a913113737": "KV:SESSION_KV",
    "a5d92afd-7c3a-48b8-89ae-abf1a523f6ce": "D1:planning-primary",
}

# Allowed staging placeholders that should NOT trigger failures
STAGING_PLACEHOLDERS = [
    "STAGING_DB_ID_PENDING",
    "STAGING_KV_ID_PENDING",
    "STAGING_FOUNDATION_DB_ID",
    "STAGING_CACHE_KV_ID",
    "STAGING_RATE_LIMIT_KV_ID",
    "STAGING_SESSION_KV_ID",
]

def strip_jsonc_comments(content: str) -> str:
    """Remove // and /* */ comments from JSONC content."""
    content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    return content


def find_staging_blocks(content: str) -> list:
    """Find all staging/preview/dev block locations in the file."""
    non_prod_envs = ['staging', 'preview', 'dev', 'development', 'test']
    blocks = []

    lines = content.split('\n')
    in_env_section = False
    current_env = None
    env_start_line = None
    brace_depth = 0

    for i, line in enumerate(lines, start=1):
        # Track brace depth
        brace_depth += line.count('{') - line.count('}')

        # Check for "env" section
        if '"env"' in line:
            in_env_section = True
            continue

        if in_env_section:
            for env in non_prod_envs:
                if re.search(rf'["\']?{env}["\']?\s*:', line, re.IGNORECASE):
                    current_env = env
                    env_start_line = i
                    break

            if current_env and env_start_line:
                blocks.append({
                    'env': current_env,
                    'start_line': env_start_line,
                    'content_start': i
                })
                current_env = None
                env_start_line = None

    return blocks


def audit_file(file_path: Path) -> list:
    """Audit a single wrangler config file for production ID leaks."""
    leaks = []

    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"ERROR: Cannot read {file_path}: {e}")
        return leaks

    lines = content.split('\n')
    non_prod_envs = ['staging', 'preview', 'dev', 'development', 'test']
    all_envs = non_prod_envs + ['production']

    # Find where staging/preview/dev blocks are
    in_env_section = False
    current_env = None
    env_brace_depth = 0
    env_start_depth = 0

    for i, line in enumerate(lines, start=1):
        # Check if we're entering the env section
        if '"env"' in line:
            in_env_section = True
            continue

        if in_env_section:
            # Check if we're entering ANY env block (including production)
            # This helps us know when to exit the previous env
            for env in all_envs:
                if re.search(rf'["\']?{env}["\']?\s*:', line, re.IGNORECASE):
                    if env in non_prod_envs:
                        current_env = env
                        env_start_depth = line.count('{')
                        env_brace_depth = env_start_depth
                    else:
                        # Entering production block - exit any non-prod tracking
                        current_env = None
                    break

            if current_env:
                # Track brace depth for current non-prod env
                open_braces = line.count('{')
                close_braces = line.count('}')
                env_brace_depth += open_braces - close_braces

                # Check for production IDs in this line
                for prod_id, resource_name in PRODUCTION_BLACKLIST.items():
                    if prod_id in line:
                        leaks.append({
                            'file': str(file_path),
                            'line': i,
                            'env': current_env,
                            'prod_id': prod_id,
                            'resource': resource_name,
                            'context': line.strip()[:80]
                        })

                # Exit env block when we close more braces than we opened
                if env_brace_depth <= 0:
                    current_env = None

    return leaks


def main():
    print("=" * 60)
    print("  CROSS-ENVIRONMENT ISOLATION AUDIT")
    print("=" * 60)
    print()

    # Find services directory
    cwd = Path.cwd()
    services_dir = None

    for path in [cwd, cwd.parent, cwd.parent.parent]:
        candidate = path / "services"
        if candidate.is_dir():
            services_dir = candidate
            break

    if not services_dir:
        print("ERROR: Cannot find 'services' directory")
        return 2

    print(f"Scanning: {services_dir}")
    print()

    # Find all wrangler configs
    configs = list(services_dir.rglob("wrangler.jsonc")) + list(services_dir.rglob("wrangler.json"))
    print(f"Found {len(configs)} config files")
    print()

    # Audit each file
    all_leaks = []
    for config in configs:
        leaks = audit_file(config)
        all_leaks.extend(leaks)

    # Report results
    print("=" * 60)

    if all_leaks:
        print(f"CRITICAL: {len(all_leaks)} PRODUCTION ID LEAK(S) DETECTED!")
        print()
        for i, leak in enumerate(all_leaks, 1):
            print(f"LEAK #{i}:")
            print(f"  File: {leak['file']}")
            print(f"  Line: {leak['line']}")
            print(f"  Environment: {leak['env']}")
            print(f"  Production ID: {leak['prod_id'][:12]}...")
            print(f"  Resource: {leak['resource']}")
            print(f"  Context: {leak['context']}")
            print()

        print("=" * 60)
        print("AUDIT FAILED: Production IDs found in non-production blocks")
        print()
        print("FIX: Replace production IDs with staging placeholders:")
        for placeholder in STAGING_PLACEHOLDERS:
            print(f"  - {placeholder}")
        return 1
    else:
        print("AUDIT PASSED: No production ID leaks detected")
        print()
        print("Note: Staging placeholders are allowed:")
        for placeholder in STAGING_PLACEHOLDERS:
            print(f"  - {placeholder}")
        return 0


if __name__ == "__main__":
    sys.exit(main())
