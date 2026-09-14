import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { I18nProvider, useI18n } from "./i18n";
import { Install } from "./pages/Install";
import { Login } from "./pages/Login";
import { Tools } from "./pages/Tools";
import { IasoWordmark } from "./ui";

function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={
          lang === "en"
            ? "font-medium text-slate-900"
            : "text-slate-400 hover:text-slate-600"
        }
      >
        {t("langEn")}
      </button>
      <span className="text-slate-300">/</span>
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={
          lang === "fr"
            ? "font-medium text-slate-900"
            : "text-slate-400 hover:text-slate-600"
        }
      >
        {t("langFr")}
      </button>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="hover:opacity-90">
          <IasoWordmark />
        </Link>
        <LanguageToggle />
      </div>
    </header>
  );
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Routes>
        <Route path="/" element={<Tools />} />
        <Route path="/install" element={<Install />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

function catalogBasename(): string {
  const path = window.location.pathname;
  if (path === "/mcp/app" || path.startsWith("/mcp/app/")) {
    return "/mcp/app";
  }
  return "/mcp";
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter basename={catalogBasename()}>
        <AppRoutes />
      </BrowserRouter>
    </I18nProvider>
  );
}
