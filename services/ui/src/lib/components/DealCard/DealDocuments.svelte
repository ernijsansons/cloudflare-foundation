<script lang="ts">
  interface Attachment { name: string; key: string; type: string; size: number; uploaded_at: number; }

  let { attachments = [], ideaId, onRefresh }: {
    attachments: Attachment[];
    ideaId: string;
    onRefresh: () => void;
  } = $props();

  let uploading = $state(false);
  let dragOver = $state(false);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
    return '📎';
  }

  async function uploadFiles(files: FileList | File[]) {
    uploading = true;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await fetch(`/api/ideas/${ideaId}/attachments`, {
          method: 'POST',
          body: formData,
        });
      } catch (e) {
        console.error('Upload error:', e);
      }
    }
    uploading = false;
    onRefresh();
  }

  async function deleteFile(name: string) {
    try {
      await fetch(`/api/ideas/${ideaId}/attachments/${encodeURIComponent(name)}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) {
      console.error('Delete error:', e);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    if (event.dataTransfer?.files) uploadFiles(event.dataTransfer.files);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) uploadFiles(input.files);
  }
</script>

<div class="docs-panel">
  <div class="panel-header">
    <h3>Documents & Files</h3>
    <p class="panel-hint">Upload PRDs, pitch decks, research docs, or any supporting files.</p>
  </div>

  <div
    class="drop-zone"
    class:drag-over={dragOver}
    class:uploading
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={() => (dragOver = false)}
    role="button"
    tabindex="0"
  >
    {#if uploading}
      <div class="upload-spinner">Uploading...</div>
    {:else}
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
      <p>Drag & drop files here, or <label class="browse-link">browse<input type="file" multiple hidden onchange={handleFileInput} /></label></p>
      <span class="drop-hint">PDF, DOCX, PPTX, images, or any file up to 25MB</span>
    {/if}
  </div>

  {#if attachments.length > 0}
    <div class="files-grid">
      {#each attachments as file}
        <div class="file-card">
          <div class="file-icon">{getFileIcon(file.type)}</div>
          <div class="file-info">
            <span class="file-name" title={file.name}>{file.name}</span>
            <span class="file-meta">{formatSize(file.size)}</span>
          </div>
          <div class="file-actions">
            <a href="/api/ideas/{ideaId}/attachments/{encodeURIComponent(file.name)}" class="download-btn" download aria-label="Download">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </a>
            <button class="delete-btn" onclick={() => deleteFile(file.name)} aria-label="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .docs-panel { padding: 1.5rem; }
  .panel-header { margin-bottom: 1.5rem; }
  .panel-header h3 { margin: 0; font-size: 1.125rem; }
  .panel-hint { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--color-text-muted); }
  .drop-zone {
    border: 2px dashed var(--color-border); border-radius: 12px;
    padding: 2rem; text-align: center; color: var(--color-text-muted);
    transition: all 0.2s; cursor: pointer; margin-bottom: 1.5rem;
  }
  .drop-zone:hover, .drop-zone.drag-over {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  }
  .drop-zone p { margin: 0.75rem 0 0.25rem; font-size: 0.875rem; }
  .drop-hint { font-size: 0.75rem; }
  .browse-link { color: var(--color-primary); cursor: pointer; font-weight: 500; }
  .upload-spinner { font-size: 0.875rem; color: var(--color-primary); }
  .files-grid { display: flex; flex-direction: column; gap: 0.5rem; }
  .file-card {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; background: var(--color-bg);
    border: 1px solid var(--color-border); border-radius: 8px;
    transition: border-color 0.15s;
  }
  .file-card:hover { border-color: var(--color-border-focus); }
  .file-icon { font-size: 1.5rem; flex-shrink: 0; }
  .file-info { flex: 1; min-width: 0; }
  .file-name { display: block; font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .file-meta { font-size: 0.75rem; color: var(--color-text-muted); }
  .file-actions { display: flex; gap: 0.25rem; }
  .download-btn, .delete-btn {
    padding: 0.375rem; border-radius: 4px; color: var(--color-text-muted);
    display: flex; align-items: center; background: transparent; border: none; cursor: pointer;
  }
  .download-btn:hover { color: var(--color-primary); }
  .delete-btn:hover { color: var(--color-error); }
</style>
