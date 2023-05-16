This django app implement Authentication via the WFP CIAM server. It is implemented as an django-allauth provider [0] .

The protocol used is OAUTH2, particularly authentification flow with PKCE challenge


[0] https://django-allauth.readthedocs.io/en/latest/advanced.html#customizing-providers


Reconciliation with existing user is via their email address (not yet implemented)
