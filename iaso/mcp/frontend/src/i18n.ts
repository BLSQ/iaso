import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "fr";

const STORAGE_KEY = "iaso-mcp-lang";

const en = {
  wordmark: "IASO",
  langEn: "English",
  langFr: "Français",
  toolsTitle: "MCP Tools",
  toolsSubtitle: "Tools exposed by the IASO MCP server",
  toolsMeta: "{name} v{version} · Protocol {protocol} · {count} tools",
  install: "Install",
  parameters: "Parameters",
  required: "required",
  optional: "optional",
  param: "param",
  params: "params",
  loadingTools: "Loading tools…",
  toolsError: "Could not load tools from the server.",
  retry: "Retry",
  backToTools: "Back to tools",
  installTitle: "MCP Setup Guide",
  installSubtitle: "Connect your AI assistant to this IASO MCP server.",
  oauthHint:
    "OAuth is the default: add the MCP URL, then authenticate in the browser (Connect in Cursor, /mcp auth on Gemini). Same pattern as OpenHEXA. Log in on IASO first. Do not put a Bearer token in a JSON config.",
  addToCursor: "Add to Cursor",
  cursorDeeplinkHint:
    "Register the URL in Cursor, then complete browser OAuth. No mcp.json and no token in the config.",
  ciTokenNote:
    "Scripts and CI can still send the MCP token from /login as an Authorization Bearer header. Do not put that token in mcp.json.",
  copy: "Copy",
  copied: "Copied",
  setupTitle: "Setup",
  authenticateTitle: "Authenticate",
  verifyTitle: "Verify",
  verifyBody: "Try the following prompt to verify that the connection is working:",
  verifyPrompt: "Who am I on this IASO account?",
  tabCursor: "Cursor",
  tabVscode: "VS Code",
  vscodeCopilotTitle: "GitHub Copilot / VS Code MCP",
  vscodeStep1:
    "Open the Command Palette and run MCP: Add Server (HTTP).",
  vscodeStep2: "Paste this MCP URL:",
  vscodeStep3:
    "Start the server, trust it when prompted, then complete browser OAuth.",
  vscodeClaudeTitle: "Claude Code extension",
  vscodeClaudeIntro:
    "The Claude extension shares Claude Code’s MCP config. In the VS Code integrated terminal:",
  vscodeClaudeMcp:
    "In the Claude chat panel, run /mcp to confirm iaso is connected, then complete OAuth.",
  tabGemini: "Gemini CLI",
  tabClaudeCode: "Claude Code",
  tabClaude: "Claude",
  tabClaudeDesktop: "Claude Desktop",
  cursorStep1:
    "Open Cursor Settings → Tools & MCP, then Add Custom MCP (or New MCP Server).",
  cursorStep2: "Name it IASO, choose HTTP, and paste this URL:",
  cursorStep3:
    "Save, then click Connect. Cursor opens a browser — no JSON file to edit.",
  cursorAuth:
    "If asked, connect on /login, then click Authorize. That is the same step as Gemini’s /mcp auth iaso.",
  geminiIntro: "Add the server with the Gemini CLI (URL only — Gemini runs OAuth):",
  geminiAuthStart: "Start Gemini CLI:",
  geminiAuthCmd: "Then authenticate:",
  claudeCodeSetup: "Run the following command in your terminal:",
  claudeCodeStart: "Start Claude Code:",
  claudeCodeMcp: "Then run the following command inside Claude Code:",
  claudeCodeAuth:
    "Select iaso and complete the browser OAuth flow. You should see iaso listed with its tools.",
  claudeStep1: "Go to Settings → Connectors → Add custom connector.",
  claudeStep2: "Set the Name to:",
  claudeStep3: "Set the Remote MCP Server URL to:",
  claudeFollow:
    "Connect the connector by following the instructions in Claude. This is Claude Connectors, not ChatGPT Apps.",
  claudeDesktopStep1:
    "In Claude Desktop, go to Settings → Connectors → Add custom connector.",
  mcpUrlLabel: "MCP URL",
} as const;

const fr: { [K in keyof typeof en]: string } = {
  wordmark: "IASO",
  langEn: "English",
  langFr: "Français",
  toolsTitle: "Outils MCP",
  toolsSubtitle: "Outils exposés par le serveur MCP IASO",
  toolsMeta: "{name} v{version} · Protocole {protocol} · {count} outils",
  install: "Installer",
  parameters: "Paramètres",
  required: "requis",
  optional: "optionnel",
  param: "param",
  params: "params",
  loadingTools: "Chargement des outils…",
  toolsError: "Impossible de charger les outils depuis le serveur.",
  retry: "Réessayer",
  backToTools: "Retour aux outils",
  installTitle: "Guide d’installation MCP",
  installSubtitle: "Connectez votre assistant IA à ce serveur MCP IASO.",
  oauthHint:
    "OAuth est le mode par défaut : ajoutez l’URL MCP, puis authentifiez-vous dans le navigateur (Connect dans Cursor, /mcp auth dans Gemini). Même schéma qu’OpenHEXA. Connectez-vous d’abord à IASO. Ne placez pas de jeton Bearer dans un fichier JSON.",
  addToCursor: "Ajouter à Cursor",
  cursorDeeplinkHint:
    "Enregistrez l’URL dans Cursor, puis terminez OAuth dans le navigateur. Pas de mcp.json, pas de jeton dans la config.",
  ciTokenNote:
    "Les scripts et la CI peuvent encore envoyer le jeton MCP de /login en en-tête Authorization Bearer. Ne le mettez pas dans mcp.json.",
  copy: "Copier",
  copied: "Copié",
  setupTitle: "Configuration",
  authenticateTitle: "Authentification",
  verifyTitle: "Vérifier",
  verifyBody:
    "Essayez l’invite suivante pour vérifier que la connexion fonctionne :",
  verifyPrompt: "Who am I on this IASO account?",
  tabCursor: "Cursor",
  tabVscode: "VS Code",
  vscodeCopilotTitle: "GitHub Copilot / MCP VS Code",
  vscodeStep1:
    "Ouvrez la palette de commandes et lancez MCP: Add Server (HTTP).",
  vscodeStep2: "Collez cette URL MCP :",
  vscodeStep3:
    "Démarrez le serveur, acceptez-le, puis terminez OAuth dans le navigateur.",
  vscodeClaudeTitle: "Extension Claude Code",
  vscodeClaudeIntro:
    "L’extension Claude partage la config MCP de Claude Code. Dans le terminal intégré de VS Code :",
  vscodeClaudeMcp:
    "Dans le panneau Claude, lancez /mcp pour vérifier que iaso est connecté, puis terminez OAuth.",
  tabGemini: "Gemini CLI",
  tabClaudeCode: "Claude Code",
  tabClaude: "Claude",
  tabClaudeDesktop: "Claude Desktop",
  cursorStep1:
    "Ouvrez Cursor Settings → Tools & MCP, puis Add Custom MCP (ou New MCP Server).",
  cursorStep2: "Nommez-le IASO, choisissez HTTP, et collez cette URL :",
  cursorStep3:
    "Enregistrez, puis cliquez sur Connect. Cursor ouvre un navigateur — aucun fichier JSON à modifier.",
  cursorAuth:
    "Si demandé, connectez-vous sur /login, puis cliquez sur Autoriser. C’est la même étape que /mcp auth iaso dans Gemini.",
  geminiIntro:
    "Ajoutez le serveur avec Gemini CLI (URL seule — Gemini lance OAuth) :",
  geminiAuthStart: "Démarrez Gemini CLI :",
  geminiAuthCmd: "Puis authentifiez-vous :",
  claudeCodeSetup: "Exécutez la commande suivante dans le terminal :",
  claudeCodeStart: "Démarrez Claude Code :",
  claudeCodeMcp: "Puis exécutez la commande suivante dans Claude Code :",
  claudeCodeAuth:
    "Sélectionnez iaso et terminez le flux OAuth dans le navigateur. iaso doit apparaître avec ses outils.",
  claudeStep1: "Allez dans Paramètres → Connecteurs → Ajouter un connecteur personnalisé.",
  claudeStep2: "Définissez le nom :",
  claudeStep3: "Définissez l’URL du serveur MCP distant :",
  claudeFollow:
    "Connectez le connecteur en suivant les instructions dans Claude. Il s’agit des connecteurs Claude, pas des apps ChatGPT.",
  claudeDesktopStep1:
    "Dans Claude Desktop, allez dans Paramètres → Connecteurs → Ajouter un connecteur personnalisé.",
  mcpUrlLabel: "URL MCP",
};

const dict = { en, fr };

export type MsgKey = keyof typeof en;

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MsgKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === "fr" ? "fr" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => {
      let text: string = dict[lang][key];
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return ctx;
}
