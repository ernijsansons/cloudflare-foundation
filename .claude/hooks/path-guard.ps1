# .claude/hooks/path-guard.ps1
# PreToolUse hook: Validates file paths are within allowed directories
# Windows PowerShell companion to path-guard.sh
# Exit 0 = allow, Exit 2 = block (stderr fed back to Claude)

param()

$ErrorActionPreference = "Stop"

# Read JSON input from stdin
$input_json = $input | Out-String
try {
    $json = $input_json | ConvertFrom-Json
    $file_path = $json.tool_input.file_path
    if (-not $file_path) {
        $file_path = $json.tool_input.filePath
    }
} catch {
    exit 0
}

# If no file path in input, allow the operation
if (-not $file_path) {
    exit 0
}

# Get absolute path
$abs_path = [System.IO.Path]::GetFullPath($file_path)
$project_root = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { Get-Location }

# Check if run-spec.json exists (Ralph mode)
$run_spec_path = ".agent/run/current/run-spec.json"
if (Test-Path $run_spec_path) {
    try {
        $run_spec = Get-Content $run_spec_path | ConvertFrom-Json
        $allowed_paths = $run_spec.allowed_paths
        $forbidden_paths = $run_spec.forbidden_paths
        $run_id = $run_spec.run_id
    } catch {
        # Ignore parse errors
    }

    # Get relative path
    $rel_path = $abs_path.Replace("$project_root\", "").Replace("\", "/")

    # Check forbidden paths first
    if ($forbidden_paths) {
        foreach ($pattern in $forbidden_paths) {
            if ($rel_path -like $pattern) {
                Write-Error "BLOCKED: Path '$rel_path' matches forbidden pattern '$pattern'"
                # Report to run-api if configured
                if ($run_id -and $env:RUN_API_URL) {
                    try {
                        $body = @{
                            hookName = "path-guard"
                            violationType = "forbidden-path"
                            details = "Matches forbidden pattern: $pattern"
                            filePath = $rel_path
                        } | ConvertTo-Json
                        Invoke-RestMethod -Uri "$env:RUN_API_URL/runs/$run_id/hook-violation" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
                    } catch {}
                }
                exit 2
            }
        }
    }

    # Check allowed paths
    if ($allowed_paths) {
        $allowed = $false
        foreach ($pattern in $allowed_paths) {
            if ($rel_path -like $pattern) {
                $allowed = $true
                break
            }
        }
        if (-not $allowed) {
            Write-Error "BLOCKED: Path '$rel_path' not in allowed_paths"
            # Report to run-api
            if ($run_id -and $env:RUN_API_URL) {
                try {
                    $body = @{
                        hookName = "path-guard"
                        violationType = "outside-allowed-paths"
                        details = "Path not in allowed_paths"
                        filePath = $rel_path
                    } | ConvertTo-Json
                    Invoke-RestMethod -Uri "$env:RUN_API_URL/runs/$run_id/hook-violation" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
                } catch {}
            }
            exit 2
        }
    }
}

# Get relative path for other checks
$rel_path = $abs_path.Replace("$project_root\", "").Replace("\", "/")

# === PROTECTED FILES ===
$protected_files = @(
    "services/planning-machine/src/workflows/planning-workflow.ts",
    "services/planning-machine/src/lib/orchestrator.ts",
    "services/planning-machine/src/lib/model-router.ts",
    "services/planning-machine/src/lib/reasoning-engine.ts",
    "services/planning-machine/src/lib/schema-validator.ts"
)

foreach ($protected in $protected_files) {
    if ($rel_path -eq $protected) {
        Write-Error "BLOCKED: '$rel_path' is a protected file. Only append imports/exports allowed."
        exit 2
    }
}

# === PROTECTED MIGRATION PATTERNS ===
if ($rel_path -match "^services/gateway/migrations/00(0[0-9]|1[0-1])_") {
    Write-Error "BLOCKED: Existing gateway migration '$rel_path' cannot be modified."
    exit 2
}

if ($rel_path -match "^services/planning-machine/migrations/000[0-6]_") {
    Write-Error "BLOCKED: Existing planning-machine migration '$rel_path' cannot be modified."
    exit 2
}

# === STALE DIRECTORIES ===
$stale_dirs = @(
    "cli-scaffold-test",
    "cli-scaffold-test3",
    "erlvinc-dashboard-temp",
    "future-idea-scaffold",
    "test-init"
)

foreach ($stale in $stale_dirs) {
    if ($rel_path -like "$stale/*") {
        Write-Error "BLOCKED: '$stale' is a stale directory marked DO NOT TOUCH."
        exit 2
    }
}

# === PATH TRAVERSAL CHECK ===
if (-not $abs_path.StartsWith($project_root.ToString())) {
    Write-Error "BLOCKED: Path traversal detected. Operation must stay within project directory."
    exit 2
}

# All checks passed
exit 0
