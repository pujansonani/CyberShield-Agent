import { useRef, useState } from "react";
import { UploadCloud, FileUp, X, Loader2 } from "lucide-react";

export type UploadedArtifact = {
  name: string;
  size: number;
  type: string;
  sha256: string;
  preview?: string;
};

const MAX_BYTES = 10 * 1024 * 1024;

async function sha256(buf: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isTextLike(f: File) {
  return (
    f.type.startsWith("text/") ||
    /\.(txt|eml|msg|log|json|csv|html?|md|xml|ya?ml|js|ts|py|ps1|bat|sh|ini|conf)$/i.test(f.name)
  );
}

export function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FileDropzone({
  file,
  onFile,
  onClear,
  disabled,
}: {
  file: UploadedArtifact | null;
  onFile: (a: UploadedArtifact) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(f: File | undefined) {
    if (!f) return;
    setError(null);
    if (f.size > MAX_BYTES) {
      setError(`File too large (${humanSize(f.size)}). Maximum is 10 MB.`);
      return;
    }
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const hash = await sha256(buf);
      let preview: string | undefined;
      if (isTextLike(f)) {
        preview = new TextDecoder().decode(buf.slice(0, 8000));
      }
      onFile({ name: f.name, size: f.size, type: f.type || "application/octet-stream", sha256: hash, preview });
    } catch {
      setError("Could not read that file. Try another artifact.");
    } finally {
      setBusy(false);
    }
  }

  if (file) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-start gap-3">
          <div
            className="size-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(94,231,255,.10)", color: "#5EE7FF" }}
          >
            <FileUp className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {humanSize(file.size)} · {file.type}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground mt-1 break-all">
              SHA-256: <span className="text-foreground/80">{file.sha256}</span>
            </p>
            {file.preview && (
              <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] font-mono text-foreground/70 whitespace-pre-wrap">
                {file.preview.slice(0, 1200)}
              </pre>
            )}
          </div>
          {!disabled && (
            <button
              onClick={onClear}
              aria-label="Remove uploaded file"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void handle(e.dataTransfer.files?.[0]); }}
        className="w-full rounded-xl border border-dashed p-7 text-center transition"
        style={{
          borderColor: over ? "rgba(94,231,255,.5)" : "rgba(255,255,255,.14)",
          background: over ? "rgba(94,231,255,.06)" : "rgba(0,0,0,.25)",
        }}
      >
        {busy ? (
          <Loader2 className="size-6 mx-auto animate-spin text-cyan-300" />
        ) : (
          <UploadCloud className="size-6 mx-auto text-cyan-300" />
        )}
        <p className="mt-2 text-sm font-medium">
          {busy ? "Hashing artifact…" : "Drop a suspicious file or click to upload"}
        </p>
        <p className="text-[11px] font-mono text-muted-foreground mt-1">
          .eml · .pdf · .exe · .zip · logs — max 10 MB, hashed locally in your browser
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => { void handle(e.target.files?.[0] ?? undefined); e.target.value = ""; }}
      />
      {error && <p className="mt-2 text-[11px] font-mono text-rose-300">{error}</p>}
    </div>
  );
}
