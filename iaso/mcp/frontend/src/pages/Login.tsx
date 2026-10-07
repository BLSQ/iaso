import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogHome, getMe, iasoLoginUrl } from "../api";
import { useI18n } from "../i18n";
import { PageShell } from "../ui";

function oauthNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/oauth/")) return null;
  return raw;
}

/** OAuth resume / IASO login bounce. No session card — the catalog is already on this IASO. */
export function Login() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const resumeOauth = oauthNext(params.get("next"));
  const next = resumeOauth || catalogHome();

  useEffect(() => {
    void getMe()
      .then((who) => {
        if (who && resumeOauth) {
          window.location.assign(resumeOauth);
          return;
        }
        if (who) {
          window.location.replace(catalogHome());
          return;
        }
        window.location.assign(iasoLoginUrl(next));
      })
      .catch(() => {
        window.location.assign(iasoLoginUrl(next));
      });
  }, [next, resumeOauth]);

  return (
    <PageShell>
      <p className="text-sm text-slate-500">{t("loadingTools")}</p>
    </PageShell>
  );
}
