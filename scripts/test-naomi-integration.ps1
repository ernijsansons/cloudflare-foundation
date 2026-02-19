# test-naomi-integration.ps1 - Smoke tests for Naomi dashboard integration
# Run: .\scripts\test-naomi-integration.ps1
# Or with custom base: .\scripts\test-naomi-integration.ps1 -BaseUrl "https://dashboard.erlvinc.com"

param(
    [string]$BaseUrl = "https://dashboard.erlvinc.com"
)

$Passed = 0
$Failed = 0

function Print-Result {
    param([string]$Name, [string]$Status, [string]$Detail = "")
    if ($Status -eq "PASS") {
        Write-Host "PASS $Name" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "FAIL $Name - $Detail" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host "=== Naomi Dashboard Integration Smoke Tests ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host ""

# 1. Health
Write-Host "--- 1. Gateway Health ---"
try {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -ErrorAction Stop
    if ($resp.status -eq "ok") {
        Print-Result "GET /api/health" "PASS"
    } else {
        Print-Result "GET /api/health" "FAIL" ($resp | ConvertTo-Json -Compress)
    }
} catch {
    Print-Result "GET /api/health" "FAIL" $_.Exception.Message
}

# 2. List Naomi tasks
Write-Host ""
Write-Host "--- 2. List Naomi Tasks ---"
try {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/naomi/tasks?limit=5" -Method Get -ErrorAction Stop
    if ($null -ne $resp.items) {
        Print-Result "GET /api/naomi/tasks" "PASS"
    } else {
        Print-Result "GET /api/naomi/tasks" "FAIL" "Missing items array"
    }
} catch {
    Print-Result "GET /api/naomi/tasks" "FAIL" $_.Exception.Message
}

# 3. Production page
Write-Host ""
Write-Host "--- 3. Production Page ---"
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/ai-labs/production" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($resp.StatusCode -eq 200) {
        Print-Result "GET /ai-labs/production" "PASS"
    } else {
        Print-Result "GET /ai-labs/production" "FAIL" "HTTP $($resp.StatusCode)"
    }
} catch {
    Print-Result "GET /ai-labs/production" "FAIL" $_.Exception.Message
}

# 4. Naomi subdomain
Write-Host ""
Write-Host "--- 4. Naomi Subdomain ---"
$naomiUrl = $BaseUrl -replace "dashboard\.", "naomi."
try {
    $resp = Invoke-WebRequest -Uri "$naomiUrl/ai-labs/production" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($resp.StatusCode -eq 200) {
        Print-Result "GET naomi.erlvinc.com/ai-labs/production" "PASS"
    } else {
        Print-Result "GET naomi.erlvinc.com/ai-labs/production" "FAIL" "HTTP $($resp.StatusCode)"
    }
} catch {
    Print-Result "GET naomi.erlvinc.com/ai-labs/production" "FAIL" $_.Exception.Message
}

# Summary
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $Passed"
Write-Host "Failed: $Failed"

if ($Failed -gt 0) {
    exit 1
}
exit 0
