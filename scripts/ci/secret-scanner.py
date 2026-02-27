#!/usr/bin/env python3
"""
Foundation Secret Scanner

Scans codebase for leaked secrets, API keys, and sensitive data.
Integrates with pre-commit hooks and CI pipeline.

Usage:
    python secret-scanner.py              # Scan entire repo
    python secret-scanner.py --staged     # Scan staged files only
    python secret-scanner.py --fix        # Remove detected secrets from history
"""

import re
import sys
import os
import subprocess
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple, Optional

# ============================================================================
# CONFIGURATION
# ============================================================================

# Patterns to detect secrets
SECRET_PATTERNS = [
    # Cloudflare API Tokens (40 char alphanumeric)
    (r"['\"]?[A-Za-z0-9_-]{40}['\"]?", "CLOUDFLARE_API_TOKEN", "high"),

    # Cloudflare Account IDs (32 char hex)
    (r"['\"]?[a-f0-9]{32}['\"]?", "CLOUDFLARE_ACCOUNT_ID", "medium"),

    # Generic API Keys
    (r"(?i)(api[_-]?key|apikey)['\"]?\s*[:=]\s*['\"]?[A-Za-z0-9_-]{20,}['\"]?", "GENERIC_API_KEY", "high"),

    # Bearer Tokens
    (r"(?i)bearer\s+[A-Za-z0-9_-]{20,}", "BEARER_TOKEN", "high"),

    # AWS Keys
    (r"AKIA[0-9A-Z]{16}", "AWS_ACCESS_KEY", "critical"),
    (r"(?i)aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9/+=]{40}['\"]?", "AWS_SECRET_KEY", "critical"),

    # GitHub Tokens
    (r"ghp_[A-Za-z0-9]{36}", "GITHUB_PAT", "critical"),
    (r"github_pat_[A-Za-z0-9_]{22,}", "GITHUB_FINE_PAT", "critical"),
    (r"gho_[A-Za-z0-9]{36}", "GITHUB_OAUTH", "critical"),

    # Private Keys
    (r"-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----", "PRIVATE_KEY", "critical"),
    (r"-----BEGIN PGP PRIVATE KEY BLOCK-----", "PGP_PRIVATE_KEY", "critical"),

    # Database Connection Strings
    (r"(?i)(postgres|mysql|mongodb|redis)://[^\s'\"]+", "DATABASE_URL", "critical"),

    # JWT Tokens
    (r"eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*", "JWT_TOKEN", "high"),

    # Stripe Keys
    (r"sk_live_[A-Za-z0-9]{24,}", "STRIPE_SECRET_KEY", "critical"),
    (r"rk_live_[A-Za-z0-9]{24,}", "STRIPE_RESTRICTED_KEY", "critical"),

    # SendGrid
    (r"SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}", "SENDGRID_API_KEY", "high"),

    # Twilio
    (r"SK[a-f0-9]{32}", "TWILIO_API_KEY", "high"),

    # Slack Tokens
    (r"xox[baprs]-[0-9A-Za-z-]{10,}", "SLACK_TOKEN", "high"),

    # OpenAI
    (r"sk-[A-Za-z0-9]{48}", "OPENAI_API_KEY", "critical"),

    # Anthropic
    (r"sk-ant-[A-Za-z0-9-]{95}", "ANTHROPIC_API_KEY", "critical"),

    # Generic Secrets
    (r"(?i)(password|passwd|pwd|secret)['\"]?\s*[:=]\s*['\"]?[^\s'\"]{8,}['\"]?", "GENERIC_SECRET", "medium"),
]

# Files/paths to skip
SKIP_PATTERNS = [
    r"\.git/",
    r"node_modules/",
    r"\.wrangler/",
    r"dist/",
    r"\.pnpm-store/",
    r"pnpm-lock\.yaml$",
    r"package-lock\.json$",
    r"\.png$",
    r"\.jpg$",
    r"\.jpeg$",
    r"\.gif$",
    r"\.ico$",
    r"\.woff2?$",
    r"\.ttf$",
    r"\.eot$",
    r"\.svg$",
    r"secret-scanner\.py$",  # Don't scan ourselves
    r"\.example$",
    r"\.template$",
]

# Known safe patterns (false positives)
SAFE_PATTERNS = [
    r"STAGING_.*_PENDING",  # Placeholder IDs
    r"YOUR_.*_ID",  # Placeholder IDs
    r"example\.com",
    r"test@example",
    r"placeholder",
    r"xxxxxxxx",
    r"00000000",
    r"__REDACTED__",
    r"process\.env\.",  # Environment variable references
    r"\$\{\{",  # GitHub Actions secrets
    r"secrets\.",  # Secret references
]

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class Finding:
    file: str
    line_number: int
    line_content: str
    pattern_name: str
    severity: str
    match: str

    def __str__(self):
        return f"[{self.severity.upper()}] {self.pattern_name} in {self.file}:{self.line_number}"

# ============================================================================
# SCANNER
# ============================================================================

def should_skip_file(filepath: str) -> bool:
    """Check if file should be skipped."""
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, filepath):
            return True
    return False

def is_safe_match(line: str, match: str) -> bool:
    """Check if match is a known safe pattern."""
    for pattern in SAFE_PATTERNS:
        if re.search(pattern, line, re.IGNORECASE):
            return True
        if re.search(pattern, match, re.IGNORECASE):
            return True
    return False

def scan_file(filepath: Path) -> List[Finding]:
    """Scan a single file for secrets."""
    findings = []

    try:
        content = filepath.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return findings

    lines = content.split('\n')

    for line_num, line in enumerate(lines, 1):
        for pattern, name, severity in SECRET_PATTERNS:
            matches = re.finditer(pattern, line)
            for match in matches:
                matched_text = match.group(0)

                # Skip safe patterns
                if is_safe_match(line, matched_text):
                    continue

                # Skip if it looks like a variable reference
                if matched_text.startswith('$') or matched_text.startswith('%'):
                    continue

                findings.append(Finding(
                    file=str(filepath),
                    line_number=line_num,
                    line_content=line[:200],  # Truncate long lines
                    pattern_name=name,
                    severity=severity,
                    match=matched_text[:50]  # Truncate match
                ))

    return findings

def scan_directory(root: Path, staged_only: bool = False) -> List[Finding]:
    """Scan directory for secrets."""
    findings = []

    if staged_only:
        # Get list of staged files
        try:
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only'],
                capture_output=True,
                text=True,
                cwd=root
            )
            files = [root / f for f in result.stdout.strip().split('\n') if f]
        except Exception:
            print("Warning: Could not get staged files, scanning all", file=sys.stderr)
            files = list(root.rglob('*'))
    else:
        files = list(root.rglob('*'))

    for filepath in files:
        if not filepath.is_file():
            continue

        if should_skip_file(str(filepath)):
            continue

        file_findings = scan_file(filepath)
        findings.extend(file_findings)

    return findings

# ============================================================================
# REPORTING
# ============================================================================

def print_findings(findings: List[Finding]) -> None:
    """Print findings in human-readable format."""
    if not findings:
        print("\n[OK] No secrets detected!")
        return

    # Group by severity
    critical = [f for f in findings if f.severity == 'critical']
    high = [f for f in findings if f.severity == 'high']
    medium = [f for f in findings if f.severity == 'medium']

    print(f"\n[ALERT] Found {len(findings)} potential secrets:\n")

    if critical:
        print("═══════════════════════════════════════════════════════")
        print("  CRITICAL SEVERITY")
        print("═══════════════════════════════════════════════════════")
        for f in critical:
            print(f"  [CRIT] {f}")
            print(f"     Line: {f.line_content[:80]}...")
            print()

    if high:
        print("───────────────────────────────────────────────────────")
        print("  HIGH SEVERITY")
        print("───────────────────────────────────────────────────────")
        for f in high:
            print(f"  [HIGH] {f}")
            print(f"     Line: {f.line_content[:80]}...")
            print()

    if medium:
        print("···························································")
        print("  MEDIUM SEVERITY")
        print("···························································")
        for f in medium:
            print(f"  [MED] {f}")
            print()

def generate_sarif(findings: List[Finding], output_path: str) -> None:
    """Generate SARIF format for GitHub Code Scanning."""
    import json

    sarif = {
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {
                "driver": {
                    "name": "Foundation Secret Scanner",
                    "version": "1.0.0",
                    "rules": [
                        {
                            "id": pattern[1],
                            "name": pattern[1],
                            "shortDescription": {"text": f"Potential {pattern[1]} detected"},
                            "defaultConfiguration": {
                                "level": "error" if pattern[2] == "critical" else "warning"
                            }
                        }
                        for pattern in SECRET_PATTERNS
                    ]
                }
            },
            "results": [
                {
                    "ruleId": f.pattern_name,
                    "level": "error" if f.severity == "critical" else "warning",
                    "message": {"text": f"Potential {f.pattern_name} detected"},
                    "locations": [{
                        "physicalLocation": {
                            "artifactLocation": {"uri": f.file},
                            "region": {
                                "startLine": f.line_number,
                                "startColumn": 1
                            }
                        }
                    }]
                }
                for f in findings
            ]
        }]
    }

    with open(output_path, 'w') as f:
        json.dump(sarif, f, indent=2)

    print(f"SARIF report saved to: {output_path}")

# ============================================================================
# ROTATION HELPERS
# ============================================================================

def suggest_rotation(finding: Finding) -> str:
    """Suggest rotation steps for detected secret."""
    suggestions = {
        "CLOUDFLARE_API_TOKEN": """
1. Go to Cloudflare Dashboard → Profile → API Tokens
2. Create a new token with same permissions
3. Update wrangler secret: wrangler secret put CLOUDFLARE_API_TOKEN
4. Revoke the old token
        """,
        "AWS_ACCESS_KEY": """
1. Go to AWS IAM Console → Users → Security credentials
2. Create new access key
3. Update all services using the key
4. Deactivate and delete the old key
        """,
        "GITHUB_PAT": """
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with same scopes
3. Update all services using the token
4. Delete the old token
        """,
        "OPENAI_API_KEY": """
1. Go to OpenAI Platform → API keys
2. Create new secret key
3. Update all services using the key
4. Delete the old key
        """,
        "ANTHROPIC_API_KEY": """
1. Go to Anthropic Console → API Keys
2. Create new API key
3. Update all services using the key
4. Revoke the old key
        """,
        "STRIPE_SECRET_KEY": """
1. Go to Stripe Dashboard → Developers → API keys
2. Roll the secret key (creates new, keeps old active for 24h)
3. Update all services using the key
        """,
    }

    return suggestions.get(finding.pattern_name, """
1. Identify the service that issued this secret
2. Generate a new secret/key
3. Update all services using the secret
4. Revoke/delete the old secret
    """)

# ============================================================================
# MAIN
# ============================================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Foundation Secret Scanner')
    parser.add_argument('--staged', action='store_true', help='Scan staged files only')
    parser.add_argument('--fix', action='store_true', help='Show rotation suggestions')
    parser.add_argument('--sarif', type=str, help='Output SARIF report to file')
    parser.add_argument('--path', type=str, default='.', help='Path to scan')
    parser.add_argument('--ci', action='store_true', help='CI mode (exit 1 on findings)')

    args = parser.parse_args()

    root = Path(args.path).resolve()
    print(f"[SCAN] Scanning: {root}")

    findings = scan_directory(root, staged_only=args.staged)

    # Deduplicate findings
    seen = set()
    unique_findings = []
    for f in findings:
        key = (f.file, f.line_number, f.pattern_name)
        if key not in seen:
            seen.add(key)
            unique_findings.append(f)

    print_findings(unique_findings)

    if args.sarif:
        generate_sarif(unique_findings, args.sarif)

    if args.fix and unique_findings:
        print("\n[ROTATE] Rotation Suggestions:\n")
        shown_patterns = set()
        for f in unique_findings:
            if f.pattern_name not in shown_patterns:
                print(f"=== {f.pattern_name} ===")
                print(suggest_rotation(f))
                shown_patterns.add(f.pattern_name)

    # Exit with error if critical/high findings in CI mode
    if args.ci:
        critical_high = [f for f in unique_findings if f.severity in ('critical', 'high')]
        if critical_high:
            print(f"\n[FAIL] CI FAILED: {len(critical_high)} critical/high severity secrets detected")
            sys.exit(1)

    if unique_findings:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
