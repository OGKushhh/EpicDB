import { buildDownloadUrl } from "~/api/manifest";

/** Download button — builds a public /download URL. No API key needed. */
export function DownloadButton({
  appName,
  effectiveId,
  fileName,
}: {
  appName: string;
  effectiveId: string;
  fileName?: string;
}) {
  const href = buildDownloadUrl(appName, effectiveId);
  return (
    <a
      href={href}
      download={fileName ?? `${effectiveId}.manifest`}
      className="btn-primary"
      title={`Download ${effectiveId}`}
    >
      <span aria-hidden>⬇</span> Download
    </a>
  );
}
