#!/bin/bash
#
# KV Backup & Restore Script
# Usage:
#   ./kv-backup-restore.sh backup <namespace_id> [output_file]
#   ./kv-backup-restore.sh restore <namespace_id> <input_file>
#   ./kv-backup-restore.sh verify <source_ns_id> <dest_ns_id>
#
# Staging KV Namespace IDs:
#   CACHE_KV:      6240f158d5744ad99cabf5db2d8e4cbf
#   RATE_LIMIT_KV: 7fa65ae86f2f47ceb4b2239a07b31eb8
#   SESSION_KV:    ec3eaf67adec4b0db41b7d5daf5ad8f3
#

set -e

COMMAND="${1:-help}"
NAMESPACE_ID="$2"
FILE_ARG="$3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

backup_kv() {
    local NS_ID="$1"
    local OUTPUT="${2:-kv-backup-$(date +%Y%m%d-%H%M%S).json}"

    log_info "Starting backup of namespace: $NS_ID"
    log_info "Output file: $OUTPUT"

    # Get list of keys
    log_info "Fetching key list..."
    local KEYS=$(npx wrangler kv key list --namespace-id "$NS_ID" 2>/dev/null)

    if [ -z "$KEYS" ] || [ "$KEYS" = "[]" ]; then
        log_warn "No keys found in namespace"
        echo "[]" > "$OUTPUT"
        return 0
    fi

    # Parse keys and build backup
    echo "[" > "$OUTPUT"
    local FIRST=true
    local COUNT=0

    # Extract key names using grep/sed (cross-platform compatible)
    echo "$KEYS" | grep -o '"name":"[^"]*"' | sed 's/"name":"//;s/"$//' | while read -r KEY; do
        if [ -n "$KEY" ]; then
            # Get value for this key
            local VALUE=$(npx wrangler kv key get --namespace-id "$NS_ID" "$KEY" 2>/dev/null || echo "")

            # Escape special characters in value for JSON
            local ESCAPED_VALUE=$(echo "$VALUE" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr '\n' ' ')

            if [ "$FIRST" = true ]; then
                FIRST=false
            else
                echo "," >> "$OUTPUT"
            fi

            echo "  {\"key\": \"$KEY\", \"value\": \"$ESCAPED_VALUE\"}" >> "$OUTPUT"
            COUNT=$((COUNT + 1))
        fi
    done

    echo "]" >> "$OUTPUT"

    log_info "Backup complete: $COUNT keys exported to $OUTPUT"
}

restore_kv() {
    local NS_ID="$1"
    local INPUT="$2"

    if [ ! -f "$INPUT" ]; then
        log_error "Input file not found: $INPUT"
        exit 1
    fi

    log_info "Starting restore to namespace: $NS_ID"
    log_info "Input file: $INPUT"

    local COUNT=0

    # Parse JSON and restore each key
    # Using a simple approach that works with basic JSON structure
    grep -o '"key": "[^"]*"' "$INPUT" | sed 's/"key": "//;s/"$//' > /tmp/kv_keys.txt
    grep -o '"value": "[^"]*"' "$INPUT" | sed 's/"value": "//;s/"$//' > /tmp/kv_values.txt

    paste /tmp/kv_keys.txt /tmp/kv_values.txt | while IFS=$'\t' read -r KEY VALUE; do
        if [ -n "$KEY" ]; then
            log_info "Restoring key: $KEY"
            echo "$VALUE" | npx wrangler kv key put --namespace-id "$NS_ID" "$KEY" - 2>/dev/null || {
                # Fallback: put value directly
                npx wrangler kv key put --namespace-id "$NS_ID" "$KEY" "$VALUE" 2>/dev/null || log_warn "Failed to restore: $KEY"
            }
            COUNT=$((COUNT + 1))
        fi
    done

    rm -f /tmp/kv_keys.txt /tmp/kv_values.txt

    log_info "Restore complete: $COUNT keys processed"
}

verify_kv() {
    local SOURCE_NS="$1"
    local DEST_NS="$2"

    log_info "Verifying namespace sync..."
    log_info "Source: $SOURCE_NS"
    log_info "Destination: $DEST_NS"

    # Get keys from both namespaces
    local SOURCE_KEYS=$(npx wrangler kv key list --namespace-id "$SOURCE_NS" 2>/dev/null | grep -o '"name":"[^"]*"' | sort)
    local DEST_KEYS=$(npx wrangler kv key list --namespace-id "$DEST_NS" 2>/dev/null | grep -o '"name":"[^"]*"' | sort)

    local SOURCE_COUNT=$(echo "$SOURCE_KEYS" | grep -c '"name"' || echo 0)
    local DEST_COUNT=$(echo "$DEST_KEYS" | grep -c '"name"' || echo 0)

    log_info "Source keys: $SOURCE_COUNT"
    log_info "Destination keys: $DEST_COUNT"

    if [ "$SOURCE_KEYS" = "$DEST_KEYS" ]; then
        log_info "VERIFICATION PASSED: Key lists match"
        return 0
    else
        log_error "VERIFICATION FAILED: Key lists differ"
        echo "--- Source only ---"
        diff <(echo "$SOURCE_KEYS") <(echo "$DEST_KEYS") | grep "^<" || true
        echo "--- Destination only ---"
        diff <(echo "$SOURCE_KEYS") <(echo "$DEST_KEYS") | grep "^>" || true
        return 1
    fi
}

show_help() {
    echo "KV Backup & Restore Script"
    echo ""
    echo "Usage:"
    echo "  $0 backup <namespace_id> [output_file]  - Export KV to JSON"
    echo "  $0 restore <namespace_id> <input_file>  - Import KV from JSON"
    echo "  $0 verify <source_ns> <dest_ns>         - Verify key sync"
    echo ""
    echo "Staging KV Namespace IDs:"
    echo "  CACHE_KV:      6240f158d5744ad99cabf5db2d8e4cbf"
    echo "  RATE_LIMIT_KV: 7fa65ae86f2f47ceb4b2239a07b31eb8"
    echo "  SESSION_KV:    ec3eaf67adec4b0db41b7d5daf5ad8f3"
}

case "$COMMAND" in
    backup)
        if [ -z "$NAMESPACE_ID" ]; then
            log_error "Namespace ID required"
            show_help
            exit 1
        fi
        backup_kv "$NAMESPACE_ID" "$FILE_ARG"
        ;;
    restore)
        if [ -z "$NAMESPACE_ID" ] || [ -z "$FILE_ARG" ]; then
            log_error "Namespace ID and input file required"
            show_help
            exit 1
        fi
        restore_kv "$NAMESPACE_ID" "$FILE_ARG"
        ;;
    verify)
        if [ -z "$NAMESPACE_ID" ] || [ -z "$FILE_ARG" ]; then
            log_error "Source and destination namespace IDs required"
            show_help
            exit 1
        fi
        verify_kv "$NAMESPACE_ID" "$FILE_ARG"
        ;;
    help|--help|-h|*)
        show_help
        ;;
esac
