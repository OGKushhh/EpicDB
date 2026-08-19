import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { type UploadResponse, ManifestClientError } from "~/api/manifest";
import { Spinner } from "~/components/Loading";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UploadPhase = "idle" | "uploading" | "success" | "error";

interface UploadIdle { phase: "idle" }
interface Uploading { phase: "uploading"; progress: number }
interface UploadSuccess { phase: "success"; result: UploadResponse }
interface UploadError { phase: "error"; message: string }

type UploadState = UploadIdle | Uploading | UploadSuccess | UploadError;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>({ phase: "idle" });

  /* ---- Reset ---- */

  const resetAndClose = useCallback(() => {
    setFiles([]);
    setDragOver(false);
    setState({ phase: "idle" });
    // Reset the file input so re-selecting the same file works
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  }, [onClose]);

  /* ---- File handling ---- */

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    // Only accept .manifest, .item, .json, .bin files
    const valid = arr.filter((f) => {
      const n = f.name.toLowerCase();
      return n.endsWith(".manifest") || n.endsWith(".item") || n.endsWith(".json") || n.endsWith(".bin");
    });
    setFiles((prev) => {
      // Deduplicate by name+size
      const existing = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const fresh = valid.filter((f) => !existing.has(`${f.name}:${f.size}`));
      return [...prev, ...fresh];
    });
    setState({ phase: "idle" });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setState({ phase: "idle" });
  }, []);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
    },
    [addFiles]
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);

  /* ---- Submit ---- */

  const canSubmit = files.length > 0 && state.phase !== "uploading" && state.phase !== "success";

  const onSubmit = useCallback(async () => {
    if (files.length === 0) return;

    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));

    setState({ phase: "uploading", progress: 0 });

    try {
      const result = await new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const base = (import.meta.env.VITE_MANIFEST_API_BASE ?? "").replace(/\/+$/, "");
        xhr.open("POST", `${base}/upload/manual`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setState({ phase: "uploading", progress: Math.round((e.loaded / e.total) * 100) });
          }
        };

        xhr.onload = () => {
          let payload: unknown = null;
          try { payload = JSON.parse(xhr.responseText); } catch { payload = { error: xhr.responseText }; }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload as UploadResponse);
          } else {
            const msg = (payload as { error?: string })?.error ?? `HTTP ${xhr.status}`;
            reject(new ManifestClientError(xhr.status, msg));
          }
        };

        xhr.onerror = () => reject(new Error("Network error — could not reach the upload endpoint."));
        xhr.send(fd);
      });

      setState({ phase: "success", result });
      onSuccess();
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }, [files, onSuccess]);

  /* ---- Render ---- */

  if (!open) return null;

  const busy = state.phase === "uploading";

  // Summary of file types for the paired-requirement hint
  const hasManifest = files.some((f) => f.name.toLowerCase().endsWith(".manifest") || f.name.toLowerCase().endsWith(".bin"));
  const hasItem = files.some((f) => f.name.toLowerCase().endsWith(".item") || f.name.toLowerCase().endsWith(".json"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={resetAndClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg border border-white/10 bg-[var(--color-bg-2)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-1">Upload Manifest</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          Upload <span className="text-[var(--color-accent)] font-medium">.manifest</span> (binary) and{" "}
          <span className="text-[var(--color-accent-blue)] font-medium">.item</span> (JSON) files.
          The backend parses app name and type automatically.
        </p>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10"
              : files.length > 0
                ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5"
                : "border-white/15 hover:border-white/30"
          }`}
        >
          {files.length === 0 ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[var(--color-text-muted)]">
                <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
                <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
              </svg>
              <span className="text-sm text-[var(--color-text-muted)]">
                Drop files here or <span className="text-[var(--color-accent-blue)] underline">browse</span>
              </span>
              <span className="text-xs text-[var(--color-text-muted)] opacity-60">
                .manifest, .item, .json, .bin
              </span>
            </>
          ) : (
            <div className="w-full text-left">
              <span className="text-sm text-[var(--color-text-muted)]">
                {files.length} file{files.length !== 1 ? "s" : ""} selected — click to add more
              </span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".manifest,.item,.json,.bin"
            multiple
            onChange={onInputChange}
            className="hidden"
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-[var(--color-bg-3)]">
            {files.map((f, i) => {
              const ext = f.name.split(".").pop()?.toLowerCase();
              const isBinary = ext === "manifest" || ext === "bin";
              return (
                <div
                  key={`${f.name}:${f.size}:${i}`}
                  className="flex items-center gap-2 px-3 py-2 text-xs border-b border-white/5 last:border-b-0"
                >
                  <span
                    className={`badge ${
                      isBinary
                        ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                        : "bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]"
                    }`}
                  >
                    {isBinary ? "binary" : "json"}
                  </span>
                  <span className="truncate flex-1 mono text-[var(--color-text)]">{f.name}</span>
                  <span className="text-[var(--color-text-muted)] shrink-0">
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="shrink-0 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                    title="Remove"
                    disabled={busy}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Paired-requirement hint */}
        {files.length > 0 && (!hasManifest || !hasItem) && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-300">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>
              Each app needs <strong>both</strong> a binary and a JSON manifest.
              {!hasManifest && " Add a <strong>.manifest</strong> file."}
              {!hasItem && " Add a <strong>.item</strong> (or .json) file."}
              {" "}If one type already exists in the database, uploading just the other is fine.
            </span>
          </div>
        )}

        {/* Progress bar */}
        {state.phase === "uploading" && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
              <span>Uploading {files.length} file{files.length !== 1 ? "s" : ""}…</span>
              <span>{state.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--color-accent-blue)] transition-all duration-200"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success */}
        {state.phase === "success" && (
          <div className="mb-4 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-3 text-sm">
            <div className="font-semibold text-[var(--color-accent)]">
              ✓ {state.result.uploaded} file{state.result.uploaded !== 1 ? "s" : ""} uploaded
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
              Apps: {state.result.apps.join(", ")}
            </div>
          </div>
        )}

        {/* Error — parse failures, paired requirement, etc. */}
        {state.phase === "error" && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <div className="font-semibold">Upload failed</div>
            <div className="mt-1 mono text-xs whitespace-pre-wrap">{state.message}</div>
            {/* Friendly hint for the paired-requirement error */}
            {state.message.includes("must have both binary and JSON") && (
              <div className="mt-2 text-xs text-red-400/80">
                Upload both a <strong>.manifest</strong> (binary) and a <strong>.item</strong> (JSON) for this app, or make sure the missing type already exists in the database.
              </div>
            )}
            {state.message.includes("Parse failed") && (
              <div className="mt-2 text-xs text-red-400/80">
                The file could not be parsed as a valid Epic manifest. Make sure the file is not corrupted and has the correct format.
              </div>
            )}
            {state.message.includes("no valid app_name") && (
              <div className="mt-2 text-xs text-red-400/80">
                The manifest file does not contain a recognizable app name. It may be incomplete or from an unsupported format.
              </div>
            )}
            {state.message.includes("no valid build_id") && (
              <div className="mt-2 text-xs text-red-400/80">
                The manifest file does not contain a valid build ID and no SHA1 fallback is available. The file may be truncated or corrupted.
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button onClick={resetAndClose} className="btn-outline !py-2 !px-4 !text-sm" disabled={busy}>
            {state.phase === "success" ? "Close" : "Cancel"}
          </button>
          {state.phase !== "success" && (
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="btn-primary !py-2 !px-4 !text-sm"
            >
              {busy ? (
                <>
                  <Spinner className="h-4 w-4" /> Uploading…
                </>
              ) : (
                <>
                  <span aria-hidden>⬆</span> Upload{files.length > 1 ? ` ${files.length} files` : ""}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
