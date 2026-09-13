import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTools, type Tool, type ToolsResponse } from "../api";
import { useI18n } from "../i18n";
import { DownloadIcon, PageShell, primaryButtonClass } from "../ui";

function schemaType(prop: { type?: string; items?: { type?: string } }): string {
  if (prop.type === "array" && prop.items?.type) {
    return `array<${prop.items.type}>`;
  }
  return prop.type || "any";
}

function ToolCard({ tool }: { tool: Tool }) {
  const { t } = useI18n();
  const properties = tool.inputSchema?.properties ?? {};
  const required = new Set(tool.inputSchema?.required ?? []);
  const names = Object.keys(properties);
  const n = names.length;

  return (
    <article className="rounded-xl border border-amber-100 bg-white p-5 transition-colors hover:border-amber-400">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-mono text-base font-medium text-amber-800">
          {tool.name}
        </h2>
        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {n} {n === 1 ? t("param") : t("params")}
        </span>
      </div>
      {tool.description ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {tool.description}
        </p>
      ) : null}
      {n > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-medium tracking-[0.14em] text-slate-400 uppercase">
            {t("parameters")}
          </p>
          <ul className="mt-2 space-y-1.5">
            {names.map((name) => {
              const prop = properties[name];
              const isRequired = required.has(name);
              return (
                <li
                  key={name}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                >
                  <span className="font-mono text-slate-800">{name}</span>
                  <span className="text-slate-400">{schemaType(prop)}</span>
                  <span
                    className={
                      isRequired
                        ? "text-xs text-red-500"
                        : "text-xs text-slate-400"
                    }
                  >
                    {isRequired ? t("required") : t("optional")}
                  </span>
                  {prop.description ? (
                    <span className="basis-full text-xs text-slate-500">
                      {prop.description}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function Tools() {
  const { t } = useI18n();
  const [data, setData] = useState<ToolsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    void getTools()
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t("toolsError"));
      });
  }

  useEffect(() => {
    load();
  }, []);

  const count = data?.tools.length ?? 0;

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t("toolsTitle")}
          </h1>
          <p className="mt-1 text-slate-500">{t("toolsSubtitle")}</p>
        </div>
        <Link
          to="/install"
          className={`${primaryButtonClass} visited:text-slate-900`}
        >
          <DownloadIcon />
          {t("install")}
        </Link>
      </div>

      {data ? (
        <p className="mt-4 text-sm text-slate-500">
          {t("toolsMeta", {
            name: data.server_name,
            version: data.server_version,
            protocol: data.protocol_version,
            count,
          })}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        {!data && !error ? (
          <p className="text-sm text-slate-500">{t("loadingTools")}</p>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error || t("toolsError")}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 font-medium text-red-800 underline"
            >
              {t("retry")}
            </button>
          </div>
        ) : null}
        {data?.tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>
    </PageShell>
  );
}
