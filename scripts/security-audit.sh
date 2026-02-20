#!/bin/bash

# Security Audit Script
# Performs comprehensive security checks across the codebase

set -e

echo "🔐 Starting Security Audit..."
echo ""

ISSUES=0
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to report issues
report_issue() {
    local severity=$1
    local category=$2
    local message=$3

    case $severity in
        CRITICAL)
            echo -e "${RED}🔴 [CRITICAL]${NC} $category: $message"
            ((CRITICAL++))
            ((ISSUES++))
            ;;
        HIGH)
            echo -e "${YELLOW}🟠 [HIGH]${NC} $category: $message"
            ((HIGH++))
            ((ISSUES++))
            ;;
        MEDIUM)
            echo -e "${YELLOW}🟡 [MEDIUM]${NC} $category: $message"
            ((MEDIUM++))
            ((ISSUES++))
            ;;
        LOW)
            echo -e "${GREEN}🟢 [LOW]${NC} $category: $message"
            ((LOW++))
            ((ISSUES++))
            ;;
    esac
}

echo "============================================================"
echo "1. Dependency Vulnerabilities Check"
echo "============================================================"

# Check for npm vulnerabilities
if command -v npm &> /dev/null; then
    echo "Running npm audit..."

    if npm audit --json > /tmp/npm-audit.json 2>&1; then
        echo "✅ No vulnerabilities found in dependencies"
    else
        # Parse npm audit results
        if [ -f /tmp/npm-audit.json ]; then
            CRITICAL_COUNT=$(jq -r '.metadata.vulnerabilities.critical // 0' /tmp/npm-audit.json 2>/dev/null || echo "0")
            HIGH_COUNT=$(jq -r '.metadata.vulnerabilities.high // 0' /tmp/npm-audit.json 2>/dev/null || echo "0")

            if [ "$CRITICAL_COUNT" -gt 0 ]; then
                report_issue "CRITICAL" "Dependencies" "Found $CRITICAL_COUNT critical vulnerabilities"
            fi

            if [ "$HIGH_COUNT" -gt 0 ]; then
                report_issue "HIGH" "Dependencies" "Found $HIGH_COUNT high severity vulnerabilities"
            fi
        fi
    fi

    rm -f /tmp/npm-audit.json
else
    echo "⚠️  npm not found, skipping dependency check"
fi

echo ""
echo "============================================================"
echo "2. Hardcoded Secrets Detection"
echo "============================================================"

# Check for potential secrets in code
echo "Scanning for hardcoded secrets..."

# AWS Keys
if grep -r "AKIA[0-9A-Z]\{16\}" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" services/ 2>/dev/null | grep -v "node_modules"; then
    report_issue "CRITICAL" "Secrets" "Potential AWS Access Key found in code"
fi

# Private Keys
if grep -r "BEGIN.*PRIVATE KEY" --include="*.ts" --include="*.js" services/ 2>/dev/null | grep -v "node_modules" | grep -v "example" | grep -v "test"; then
    report_issue "CRITICAL" "Secrets" "Potential private key found in code"
fi

# API Keys (basic check)
if grep -r "api[_-]\?key.*=.*['\"][a-zA-Z0-9]\{20,\}['\"]" --include="*.ts" --include="*.js" services/ 2>/dev/null | grep -v "node_modules" | grep -v "placeholder" | grep -v "example"; then
    report_issue "HIGH" "Secrets" "Potential hardcoded API key found"
fi

# GitHub tokens
if grep -r "gh[pousr]_[A-Za-z0-9_]\{36,\}" --include="*.ts" --include="*.js" services/ 2>/dev/null | grep -v "node_modules"; then
    report_issue "CRITICAL" "Secrets" "Potential GitHub token found in code"
fi

echo ""
echo "============================================================"
echo "3. Insecure Code Patterns"
echo "============================================================"

# Check for dangerous functions
echo "Checking for insecure code patterns..."

# SQL injection risk
if grep -r "SELECT.*+.*req\|SELECT.*+.*params" --include="*.ts" --include="*.js" services/ 2>/dev/null | grep -v "node_modules"; then
    report_issue "HIGH" "SQL Injection" "Potential SQL injection via string concatenation"
fi

# Weak crypto
if grep -r "createHash.*md5\|createHmac.*md5" --include="*.ts" --include="*.js" services/ 2>/dev/null | grep -v "node_modules"; then
    report_issue "MEDIUM" "Weak Crypto" "MD5 hash algorithm detected (use SHA-256 or stronger)"
fi

# Console logs in production code
CONSOLE_COUNT=$(grep -r "console\.log\|console\.debug" --include="*.ts" --include="*.js" services/ 2>/dev/null | grep -v "node_modules" | grep -v ".test." | grep -v ".spec." | wc -l)
if [ "$CONSOLE_COUNT" -gt 20 ]; then
    report_issue "LOW" "Code Quality" "Excessive console.log statements found ($CONSOLE_COUNT) - consider using proper logging"
fi

echo ""
echo "============================================================"
echo "4. Environment & Configuration"
echo "============================================================"

# Check for .env files in git
if git ls-files | grep -E "\.env$|\.env\.local$|\.env\.production$" 2>/dev/null; then
    report_issue "CRITICAL" "Configuration" ".env files should not be committed to git"
fi

# Check wrangler.toml for secrets
if grep -r "secret\|password\|key.*=" wrangler.toml 2>/dev/null | grep -v "^\s*#"; then
    report_issue "HIGH" "Configuration" "Potential secrets in wrangler.toml (use wrangler secret instead)"
fi

echo ""
echo "============================================================"
echo "5. TypeScript & Code Quality"
echo "============================================================"

# Check for any usage
ANY_COUNT=$(grep -r ": any" --include="*.ts" --include="*.tsx" services/ 2>/dev/null | grep -v "node_modules" | grep -v ".test." | wc -l)
if [ "$ANY_COUNT" -gt 50 ]; then
    report_issue "MEDIUM" "Type Safety" "Excessive use of 'any' type ($ANY_COUNT instances) - reduces type safety"
fi

# Check for @ts-ignore
IGNORE_COUNT=$(grep -r "@ts-ignore" --include="*.ts" --include="*.tsx" services/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$IGNORE_COUNT" -gt 10 ]; then
    report_issue "MEDIUM" "Type Safety" "Excessive @ts-ignore comments ($IGNORE_COUNT) - indicates type issues"
fi

echo ""
echo "============================================================"
echo "6. Security Headers (Manual Check)"
echo "============================================================"

echo "ℹ️  Verify the following security headers are configured:"
echo "   - X-Content-Type-Options: nosniff"
echo "   - X-Frame-Options: DENY"
echo "   - X-XSS-Protection: 1; mode=block"
echo "   - Strict-Transport-Security: max-age=31536000"
echo "   - Content-Security-Policy"

echo ""
echo "============================================================"
echo "Summary"
echo "============================================================"
echo "Total Issues: $ISSUES"
echo "  🔴 Critical: $CRITICAL"
echo "  🟠 High: $HIGH"
echo "  🟡 Medium: $MEDIUM"
echo "  🟢 Low: $LOW"
echo ""

if [ $CRITICAL -gt 0 ] || [ $HIGH -gt 0 ]; then
    echo "❌ Security audit FAILED - Critical or high severity issues found"
    exit 1
else
    echo "✅ Security audit PASSED - No critical or high severity issues found"
    exit 0
fi
