# test-orchestration.ps1 - Manual validation for LLM orchestration
# Run with ORCHESTRATION_ENABLED=true and MINIMAX_API_KEY set.
#
# Prerequisites:
#   1. wrangler secret put MINIMAX_API_KEY   # required for synthesis (default)
#   2. Set ORCHESTRATION_ENABLED: "true" in services/planning-machine/wrangler.jsonc vars
#   3. Apply migration: npx wrangler d1 migrations apply planning-primary --remote
#
# Usage:
#   .\scripts\test-orchestration.ps1                    # run against local dev
#   .\scripts\test-orchestration.ps1 -BaseUrl "https://..."  # run against deployed

param(
    [string]$BaseUrl = "http://localhost:8789"
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

Write-Host "=== LLM Orchestration Validation ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "Ensure ORCHESTRATION_ENABLED=true and MINIMAX_API_KEY is set."
Write-Host ""

# 1. Create a planning run (opportunity phase uses orchestration)
# Note: Use BaseUrl for planning machine directly (e.g. http://localhost:8789 when running planning:dev)
Write-Host "--- 1. Trigger Opportunity Phase (orchestration path) ---"
try {
    $body = '{"idea":"AI-powered CRM for small businesses"}'
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/planning/run-opportunity" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    if ($resp -and $resp.output) {
        Print-Result "POST /api/planning/run-opportunity" "PASS"
        if ($resp.orchestration) {
            Write-Host "  Orchestration: model_outputs=$($resp.orchestration.modelOutputs.Count), wild_ideas=$($resp.orchestration.wildIdeas.Count)" -ForegroundColor Gray
        } else {
            Write-Host "  (No orchestration in response - check ORCHESTRATION_ENABLED)" -ForegroundColor Yellow
        }
    } else {
        Print-Result "POST /api/planning/run-opportunity" "FAIL" "Missing output"
    }
} catch {
    Print-Result "POST /api/planning/run-opportunity" "FAIL" $_.Exception.Message
}

# 2. Kill-test phase (also uses orchestration when enabled)
Write-Host ""
Write-Host "--- 2. Trigger Kill-Test Phase (orchestration path) ---"
try {
    $body = '{"idea":"AI-powered CRM for small businesses","refinedIdea":"AI-powered CRM for small businesses","priorOutputs":{}}'
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/planning/run-kill-test" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    if ($resp -and $resp.output) {
        Print-Result "POST /api/planning/run-kill-test" "PASS"
        if ($resp.orchestration) {
            Write-Host "  Orchestration: model_outputs=$($resp.orchestration.modelOutputs.Count), wild_ideas=$($resp.orchestration.wildIdeas.Count)" -ForegroundColor Gray
        } else {
            Write-Host "  (No orchestration in response - check ORCHESTRATION_ENABLED)" -ForegroundColor Yellow
        }
    } else {
        Print-Result "POST /api/planning/run-kill-test" "FAIL" "Missing output"
    }
} catch {
    Print-Result "POST /api/planning/run-kill-test" "FAIL" $_.Exception.Message
}

Write-Host ""
Write-Host "=== Done: $Passed passed, $Failed failed ===" -ForegroundColor Cyan
