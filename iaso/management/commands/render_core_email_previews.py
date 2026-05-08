"""Write static HTML/TXT previews of core IASO emails for local layout review."""

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string

from iaso.mail.branding import core_email_branding_context


class _PreviewUser:
    def get_username(self):
        return "preview.user"


class Command(BaseCommand):
    help = (
        "Render core transactional emails to files under var/email-previews/ (gitignored). "
        "Logos are embedded as data URIs by default so previews work without runserver. "
        "Open the .html files in a browser to check layout."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default="var/email-previews",
            help="Directory path relative to BASE_DIR (default: var/email-previews)",
        )
        parser.add_argument(
            "--only",
            choices=("all", "invite", "reset"),
            default="all",
            help="Which mail to render (default: all)",
        )
        parser.add_argument(
            "--http-logo",
            action="store_true",
            help="Use http(s) logo URLs instead of inlining (default: embed logo as data URI so previews work offline).",
        )

    def handle(self, *args, **options):
        out_dir = Path(settings.BASE_DIR) / options["output"]
        out_dir.mkdir(parents=True, exist_ok=True)
        only = options["only"]
        embed_logo = not options["http_logo"]

        domain = settings.DNS_DOMAIN
        protocol = "https"

        brand = core_email_branding_context(protocol=protocol, domain=domain, embed_static_logo=embed_logo)
        if embed_logo and not str(brand.get("email_logo_url", "")).startswith("data:"):
            self.stdout.write(
                self.style.WARNING(
                    "Logo file not found for embedding; falling back to HTTP URL (start the app or use --http-logo)."
                )
            )

        if only in ("all", "invite"):
            ctx = {
                **brand,
                "protocol": protocol,
                "domain": domain,
                "account_name": "Preview account",
                "user_name": "preview.user",
                "url": f"{protocol}://{domain}/reset-password-confirmation/MQ/preview-token/",
            }
            for ext, template in (
                ("html", "emails/create_password_email.html"),
                ("txt", "emails/create_password_email.txt"),
            ):
                path = out_dir / f"create_password_invitation.{ext}"
                path.write_text(render_to_string(template, ctx), encoding="utf-8")
                self.stdout.write(self.style.SUCCESS(f"Wrote {path}"))

        if only in ("all", "reset"):
            ctx = {
                **brand,
                "email": "preview.user@example.com",
                "domain": domain,
                "site_name": settings.APP_TITLE,
                "uid": "MQ",
                "token": "preview-token",
                "user": _PreviewUser(),
                "protocol": protocol,
            }
            for ext, template in (
                ("html", "iaso/reset_password_email.html"),
                ("txt", "iaso/reset_password_email.txt"),
            ):
                path = out_dir / f"password_reset.{ext}"
                path.write_text(render_to_string(template, ctx), encoding="utf-8")
                self.stdout.write(self.style.SUCCESS(f"Wrote {path}"))

        self.stdout.write(f"Done. Open files under: {out_dir.resolve()} (HTML in a browser, TXT in an editor).")
