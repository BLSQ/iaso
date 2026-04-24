import dotenv


dotenv.load_dotenv(".env.test")

from .settings import *


TEST_MODE = True
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
