# .claude/hooks/pre-commit-audit.ps1
# PreToolUse hook: Audits git commits before they happen
# Windows PowerShell companion to pre-commit-audit.sh
# Runs lint, typecheck, test before allowing commit
# Exit 0 = allow, Exit 2 = block (stderr fed back to Claude)

param()

$ErrorActionPreference = "Stop"

# Read JSON input from stdin
$input_json = $input | Out-String
try {
    $json = $input_json | ConvertFrom-Json
    $command = $json.tool_input.command
} catch {
    exit 0
}

# Only intercept git commit commands
if (-not ($command -match '^git\s+commit')) {
    exit 0
}

# Check for skipped hooks (prohibited)
if ($command -match '(--no-verify|--no-gpg-sign)') {
    Write-Error "BLOCKED: --no-verify and --no-gpg-sign flags are prohibited."
    exit 2
}

# Check for amend on already-pushed commits
if ($command -match '--amend') {
    $git_status = git status 2>&1 | Out-String
    if ($git_status -match "Your branch is behind|up to date") {
        Write-Error "BLOCKED: --amend on already-pushed commits is prohibited. Create a new commit."
        exit 2
    }
}

# === PRE-COMMIT QUALITY GATES ===
$project_root = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { Get-Location }
Push-Location $project_root

try {
    # 1. Run lint
    Write-Host "Pre-commit: Running lint..." -ForegroundColor Cyan
    $lint_result = pnpm lint 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "BLOCKED: Lint check failed. Fix linting errors before committing."
        Write-Host $lint_result
        exit 2
    }

    # 2. Run typecheck (Workers only - faster)
    Write-Host "Pre-commit: Running typecheck..." -ForegroundColor Cyan
    $typecheck_result = pnpm run typecheck:workers 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "BLOCKED: TypeScript check failed. Fix type errors before committing."
        Write-Host $typecheck_result
        exit 2
    }

    # 3. Run tests (optional - check if run-spec specifies tests)
    $run_spec_path = ".agent/run/current/run-spec.json"
    if (Test-Path $run_spec_path) {
        try {
            $run_spec = Get-Content $run_spec_path | ConvertFrom-Json
            $test_cmd = $run_spec.commands.test
            if ($test_cmd) {
                Write-Host "Pre-commit: Running tests..." -ForegroundColor Cyan
                $test_result = Invoke-Expression $test_cmd 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "BLOCKED: Tests failed. Fix failing tests before committing."
                    Write-Host $test_result
                    exit 2
                }
            }
        } catch {}
    }

    Write-Host "Pre-commit: All checks passed." -ForegroundColor Green
    exit 0
}
finally {
    Pop-Location
}
