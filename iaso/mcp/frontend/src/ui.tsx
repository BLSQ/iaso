import { useState, type ReactNode } from "react";
import mark from "./assets/iaso-mark.png";
import { useI18n } from "./i18n";

export const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-amber-500 disabled:opacity-60";

export function CodeBlock({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-slate-900 text-slate-100">
      <button
        type="button"
        onClick={() => void copy()}
        className="absolute top-2 right-2 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
      >
        {copied ? t("copied") : t("copy")}
      </button>
      <pre className="overflow-x-auto p-4 pr-20 text-sm leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DownloadIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12M12 16.5V3"
      />
    </svg>
  );
}

export function IasoWordmark() {
  return (
    <span className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-900">
      <img
        src={mark}
        alt=""
        width={36}
        height={36}
        className="size-9 object-contain"
      />
      IASO
    </span>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">{children}</div>
  );
}
