import os
import tempfile

from django.template.loader import render_to_string
from django.test import SimpleTestCase, override_settings

from iaso.mail.branding import core_email_branding_context


class CoreEmailBrandingContextTest(SimpleTestCase):
    @override_settings(
        APP_TITLE="Test App",
        THEME_PRIMARY_COLOR="#112233",
        THEME_PRIMARY_BACKGROUND_COLOR="#eeeeee",
        LOGO_PATH="images/logo.png",
        STATIC_URL="/static/",
    )
    @override_settings(DEFAULT_FROM_EMAIL="Iaso <no-reply@example.org>")
    def test_logo_url_with_relative_static(self):
        ctx = core_email_branding_context(protocol="http", domain="localhost:8081")
        self.assertEqual(ctx["email_app_title"], "Test App")
        self.assertEqual(ctx["email_theme_primary"], "#112233")
        self.assertEqual(ctx["email_logo_url"], "http://localhost:8081/static/images/logo.png")
        self.assertEqual(ctx["email_contact_mailto"], "mailto:no-reply@example.org")
        self.assertIn("no-reply@example.org", ctx["email_contact_display"])


_MIN_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xba\x00\x00\x00\x00IEND\xaeB`\x82"
)


class EmbedStaticLogoTest(SimpleTestCase):
    def test_embed_static_logo_inlines_data_uri(self):
        with tempfile.TemporaryDirectory() as tmp:
            img_dir = os.path.join(tmp, "images")
            os.makedirs(img_dir, exist_ok=True)
            logo_path = os.path.join(img_dir, "pixel.png")
            with open(logo_path, "wb") as f:
                f.write(_MIN_PNG)

            with override_settings(
                STATICFILES_DIRS=(tmp,),
                LOGO_PATH="images/pixel.png",
                STATIC_URL="/static/",
                APP_TITLE="App",
                THEME_PRIMARY_COLOR="#000",
                THEME_SECONDARY_COLOR="#000",
                THEME_PRIMARY_BACKGROUND_COLOR="#fff",
                DEFAULT_FROM_EMAIL="a@b.co",
            ):
                ctx = core_email_branding_context(
                    protocol="https", domain="example.com", embed_static_logo=True
                )
            self.assertTrue(ctx["email_logo_url"].startswith("data:image/png;base64,"))


class ResetPasswordEmailTemplateTest(SimpleTestCase):
    @override_settings(
        APP_TITLE="IASO Test",
        THEME_PRIMARY_COLOR="#006699",
        THEME_PRIMARY_BACKGROUND_COLOR="#F5F5F5",
        LOGO_PATH="images/logo.png",
        STATIC_URL="/static/",
        DEFAULT_FROM_EMAIL="Support <support@example.com>",
    )
    def test_reset_password_html_wraps_with_branding(self):
        class DummyUser:
            def get_username(self):
                return "jdoe"

        html = render_to_string(
            "iaso/reset_password_email.html",
            {
                **core_email_branding_context(protocol="https", domain="example.com"),
                "email": "jdoe@example.com",
                "domain": "example.com",
                "site_name": "Example",
                "uid": "MQ",
                "token": "reset-token",
                "user": DummyUser(),
                "protocol": "https",
            },
        )
        self.assertIn("IASO Test", html)
        self.assertIn("https://example.com/static/images/logo.png", html)
        self.assertIn("jdoe", html)
        self.assertIn("max-width:600px", html)
        self.assertIn("mailto:support@example.com", html)


class CreatePasswordEmailTemplateTest(SimpleTestCase):
    @override_settings(
        APP_TITLE="IASO Test",
        THEME_PRIMARY_COLOR="#006699",
        THEME_PRIMARY_BACKGROUND_COLOR="#F5F5F5",
        LOGO_PATH="images/logo.png",
        STATIC_URL="/static/",
        DEFAULT_FROM_EMAIL="Support <support@example.com>",
    )
    def test_create_password_html_wraps_with_branding(self):
        html = render_to_string(
            "emails/create_password_email.html",
            {
                **core_email_branding_context(protocol="https", domain="example.com"),
                "protocol": "https",
                "domain": "example.com",
                "account_name": "Acme",
                "user_name": "jdoe",
                "url": "https://example.com/reset/x/y/",
            },
        )
        self.assertIn("IASO Test", html)
        self.assertIn("https://example.com/static/images/logo.png", html)
        self.assertIn("background-color:#F5F5F5", html)
        self.assertIn("background-color:#006699", html)
        self.assertIn("jdoe", html)
        self.assertIn("max-width:600px", html)
        self.assertIn("mailto:support@example.com", html)
        self.assertIn("Contact us", html)
