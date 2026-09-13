import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { mcpUrl } from "../api";
import { useI18n, type MsgKey } from "../i18n";
import { CodeBlock, PageShell, primaryButtonClass } from "../ui";

type TabId =
  | "cursor"
  | "vscode"
  | "gemini"
  | "claudeCode"
  | "claude"
  | "claudeDesktop";

const TABS: { id: TabId; label: MsgKey }[] = [
  { id: "cursor", label: "tabCursor" },
  { id: "vscode", label: "tabVscode" },
  { id: "gemini", label: "tabGemini" },
  { id: "claudeCode", label: "tabClaudeCode" },
  { id: "claude", label: "tabClaude" },
  { id: "claudeDesktop", label: "tabClaudeDesktop" },
];

function cursorInstallHref(url: string): string {
  const config = btoa(JSON.stringify({ url }));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent("IASO")}&config=${encodeURIComponent(config)}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ol>
  );
}

export function Install() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("cursor");
  const url = useMemo(() => mcpUrl(), []);
  const cursorHref = useMemo(() => cursorInstallHref(url), [url]);
  const claudeCodeCmd = `claude mcp add iaso --transport http ${url}`;
  const geminiAddCmd = `gemini mcp add iaso --transport http ${url}`;

  return (
    <PageShell>
      <Link
        to="/"
        className="text-sm text-slate-500 hover:text-amber-700 visited:text-slate-500"
      >
        ← {t("backToTools")}
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
        {t("installTitle")}
      </h1>
      <p className="mt-1 text-slate-500">{t("installSubtitle")}</p>

      <p className="mt-4 text-sm text-slate-500">{t("oauthHint")}</p>

      <div className="mt-6 overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                tab === item.id
                  ? "border-b-2 border-amber-500 px-3 py-2 text-sm font-medium text-amber-800"
                  : "border-b-2 border-transparent px-3 py-2 text-sm text-slate-500 hover:text-slate-800"
              }
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {tab === "cursor" ? (
          <>
            <Section title={t("setupTitle")}>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("cursorDeeplinkHint")}
              </p>
              <a href={cursorHref} className={primaryButtonClass}>
                {t("addToCursor")}
              </a>
              <Steps
                items={[
                  t("cursorStep1"),
                  <>
                    {t("cursorStep2")}
                    <div className="mt-2">
                      <CodeBlock code={url} />
                    </div>
                  </>,
                  t("cursorStep3"),
                ]}
              />
            </Section>
            <Section title={t("authenticateTitle")}>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("cursorAuth")}
              </p>
            </Section>
          </>
        ) : null}

        {tab === "vscode" ? (
          <>
            <Section title={t("setupTitle")}>
              <p className="text-sm font-medium text-slate-800">
                {t("vscodeCopilotTitle")}
              </p>
              <Steps
                items={[
                  t("vscodeStep1"),
                  <>
                    {t("vscodeStep2")}
                    <div className="mt-2">
                      <CodeBlock code={url} />
                    </div>
                  </>,
                  t("vscodeStep3"),
                ]}
              />
            </Section>
            <Section title={t("vscodeClaudeTitle")}>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("vscodeClaudeIntro")}
              </p>
              <CodeBlock code={claudeCodeCmd} />
              <p className="text-sm leading-relaxed text-slate-600">
                {t("vscodeClaudeMcp")}
              </p>
              <CodeBlock code="/mcp" />
            </Section>
          </>
        ) : null}

        {tab === "gemini" ? (
          <>
            <Section title={t("setupTitle")}>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("geminiIntro")}
              </p>
              <CodeBlock code={geminiAddCmd} />
            </Section>
            <Section title={t("authenticateTitle")}>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("geminiAuthStart")}
              </p>
              <CodeBlock code="gemini" />
              <p className="text-sm leading-relaxed text-slate-600">
                {t("geminiAuthCmd")}
              </p>
              <CodeBlock code="/mcp auth iaso" />
            </Section>
          </>
        ) : null}

        {tab === "claudeCode" ? (
          <>
            <Section title={t("setupTitle")}>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("claudeCodeSetup")}
              </p>
              <CodeBlock code={claudeCodeCmd} />
            </Section>
            <Section title={t("authenticateTitle")}>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("claudeCodeStart")}
              </p>
              <CodeBlock code="claude" />
              <p className="text-sm leading-relaxed text-slate-600">
                {t("claudeCodeMcp")}
              </p>
              <CodeBlock code="/mcp" />
              <p className="text-sm leading-relaxed text-slate-600">
                {t("claudeCodeAuth")}
              </p>
            </Section>
          </>
        ) : null}

        {tab === "claude" ? (
          <Section title={t("setupTitle")}>
            <Steps
              items={[
                t("claudeStep1"),
                <>
                  {t("claudeStep2")} <code className="font-mono text-slate-800">IASO</code>
                </>,
                <>
                  {t("claudeStep3")}
                  <div className="mt-2">
                    <CodeBlock code={url} />
                  </div>
                </>,
              ]}
            />
            <p className="text-sm leading-relaxed text-slate-600">
              {t("claudeFollow")}
            </p>
          </Section>
        ) : null}

        {tab === "claudeDesktop" ? (
          <Section title={t("setupTitle")}>
            <Steps
              items={[
                t("claudeDesktopStep1"),
                <>
                  {t("claudeStep2")} <code className="font-mono text-slate-800">IASO</code>
                </>,
                <>
                  {t("claudeStep3")}
                  <div className="mt-2">
                    <CodeBlock code={url} />
                  </div>
                </>,
              ]}
            />
            <p className="text-sm leading-relaxed text-slate-600">
              {t("claudeFollow")}
            </p>
          </Section>
        ) : null}

        <Section title={t("verifyTitle")}>
          <p className="text-sm text-slate-500">{t("verifyBody")}</p>
          <CodeBlock code={t("verifyPrompt")} />
        </Section>
        <p className="text-xs leading-relaxed text-slate-400">{t("ciTokenNote")}</p>
      </div>
    </PageShell>
  );
}
