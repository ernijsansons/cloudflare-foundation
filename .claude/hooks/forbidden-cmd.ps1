# .claude/hooks/forbidden-cmd.ps1
# PreToolUse hook: Blocks dangerous shell commands
# Windows PowerShell companion to forbidden-cmd.sh
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

# If no command, allow
if (-not $command) {
    exit 0
}

# Helper function to report violations to run-api
function Report-Violation {
    param(
        [string]$ViolationType,
        [string]$Details
    )

    $run_spec_path = ".agent/run/current/run-spec.json"
    if (Test-Path $run_spec_path) {
        try {
            $run_spec = Get-Content $run_spec_path | ConvertFrom-Json
            $run_id = $run_spec.run_id
            if ($run_id -and $env:RUN_API_URL) {
                $body = @{
                    hookName = "forbidden-cmd"
                    violationType = $ViolationType
                    details = $Details
                    command = $command
                } | ConvertTo-Json
                Invoke-RestMethod -Uri "$env:RUN_API_URL/runs/$run_id/hook-violation" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
            }
        } catch {}
    }
}

# === BLOCKED COMMANDS ===

# Destructive rm/del patterns
if ($command -match 'rm\s+(-rf?|--recursive)\s+(/|~|\.\.|\$HOME|\$CLAUDE_PROJECT_DIR\s*$)' -or
    $command -match 'Remove-Item\s+.*-Recurse\s+.*(/|~|\.\.|\$HOME|\$env:USERPROFILE)' -or
    $command -match 'del\s+/s\s+(/|\\)') {
    Write-Error "BLOCKED: Recursive delete of root, home, or project root is prohibited."
    Report-Violation "destructive-rm" "Recursive delete of root/home/project"
    exit 2
}

# Git force push to main/master
if ($command -match 'git\s+push\s+.*(-f|--force).*\s+(main|master|origin/main|origin/master)') {
    Write-Error "BLOCKED: Force push to main/master is prohibited."
    Report-Violation "force-push-main" "Force push to main/master"
    exit 2
}

# Git hard reset
if ($command -match 'git\s+reset\s+--hard') {
    Write-Error "BLOCKED: git reset --hard is destructive. Use git stash or git checkout instead."
    Report-Violation "hard-reset" "git reset --hard is destructive"
    exit 2
}

# Drop table/database commands
if ($command -match '(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)') {
    Write-Error "BLOCKED: DROP TABLE/DATABASE and TRUNCATE commands are prohibited."
    Report-Violation "drop-command" "DROP/TRUNCATE command"
    exit 2
}

# Curl to external URLs (potential data exfiltration)
if ($command -match 'curl\s+.*https?://') {
    if ($command -notmatch 'curl\s+.*https?://(localhost|127\.0\.0\.1|.*\.workers\.dev)') {
        Write-Error "BLOCKED: External curl requests require explicit approval."
        Report-Violation "external-curl" "External curl request"
        exit 2
    }
}

# Check for commands touching forbidden paths from run-spec
$run_spec_path = ".agent/run/current/run-spec.json"
if (Test-Path $run_spec_path) {
    try {
        $run_spec = Get-Content $run_spec_path | ConvertFrom-Json
        $forbidden_paths = $run_spec.forbidden_paths

        foreach ($pattern in $forbidden_paths) {
            if ($pattern -and $command -match [regex]::Escape($pattern)) {
                Write-Error "BLOCKED: Command references forbidden path '$pattern'."
                Report-Violation "forbidden-path-reference" "Command references forbidden path: $pattern"
                exit 2
            }
        }
    } catch {}
}

# === SENSITIVE COMMANDS (warn but allow) ===

# wrangler secret commands
if ($command -match 'wrangler\s+secret\s+(put|delete)') {
    Write-Warning "WARNING: Secrets management command detected. Ensure correct environment."
    exit 0
}

# Deploy commands
if ($command -match '(wrangler\s+deploy|pnpm\s+run\s+deploy|npx\s+wrangler\s+deploy)') {
    if ($command -notmatch '--dry-run') {
        Write-Warning "WARNING: Production deployment detected. Consider using --dry-run first."
    }
    exit 0
}

# Allow the command
exit 0
