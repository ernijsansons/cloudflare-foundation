# Cleanup Recommendations

This document identifies resources and directories outside the monorepo that can be safely removed after backup.

## Stale Scaffold Directories

Located outside the monorepo at `C:\dev\.cloudflare\`:

### 1. `cli-scaffold-test/`
- **Type**: Outdated scaffold copy
- **Description**: Near-identical copy of cloudflare-foundation at an earlier version
- **Issue**: Uses outdated wrangler dependency
- **Status**: ⚠️  Stale - safe to delete after backup

### 2. `cli-scaffold-test3/`
- **Type**: Duplicate scaffold copy
- **Description**: Another copy of cloudflare-foundation
- **Issue**: Uses wrangler `^4.36.0` (vs `^4.66.0` in main repo)
- **Last Updated**: Unknown
- **Status**: ⚠️  Stale - safe to delete after backup

## Why These Directories Exist

These directories were likely created during:
- CLI scaffolding experiments
- Testing different wrangler versions
- Prototyping before the monorepo structure was finalized

## Recommended Action

1. **Backup**: If unsure, create archives:
   ```bash
   tar -czf cli-scaffold-test-backup.tar.gz C:\dev\.cloudflare\cli-scaffold-test\
   tar -czf cli-scaffold-test3-backup.tar.gz C:\dev\.cloudflare\cli-scaffold-test3\
   ```

2. **Verify**: Check if any local changes exist:
   ```bash
   cd C:\dev\.cloudflare\cli-scaffold-test\
   git status
   git diff

   cd C:\dev\.cloudflare\cli-scaffold-test3\
   git status
   git diff
   ```

3. **Delete**: Once verified, remove the directories:
   ```bash
   rm -rf C:\dev\.cloudflare\cli-scaffold-test\
   rm -rf C:\dev\.cloudflare\cli-scaffold-test3\
   ```

## Benefits of Cleanup

- **Reduced workspace clutter**: Easier to navigate `C:\dev\.cloudflare\`
- **Avoid confusion**: Prevents accidentally working in outdated copies
- **Disk space**: Frees up space (each directory ~100-200 MB)
- **Clarity**: Makes it clear that `cloudflare-foundation-dev` is the active repo

## Risk Assessment

**Low Risk** ✅
- These are copies outside the main monorepo
- No production systems depend on them
- The main repo (`cloudflare-foundation-dev`) is unaffected
- Can always restore from backup if needed

---

**Last Updated**: 2026-02-23
**Status**: Ready for cleanup
