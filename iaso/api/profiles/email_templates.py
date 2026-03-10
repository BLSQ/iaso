# English templates
EMAIL_SUBJECT_EN = "Set up a password for your new account on {domain}"

CREATE_PASSWORD_MESSAGE_EN = """Hello,

You have been invited to access IASO - {protocol}://{domain}.

Username: {userName} 

Please click on the link below to create your password:

{url}

If clicking the link above doesn't work, please copy and paste the URL in a new browser
window instead.

If you did not request an account on {account_name}, you can ignore this e-mail - no password will be created.

Sincerely,
The {domain} Team.
"""

CREATE_PASSWORD_HTML_MESSAGE_EN = """<p>Hello,<br><br>

You have been invited to access IASO - <a href="{{protocol}}://{{domain}}" target="_blank">{{account_name}}</a>.<br><br>

Username: <strong>{{userName}}</strong><br><br>

Please click on the link below to create your password:<br><br>

<a href="{{url}}" target="_blank">{{url}}</a><br><br>

If clicking the link above doesn't work, please copy and paste the URL in a new browser<br>
window instead.<br><br>

If you did not request an account on {{account_name}}, you can ignore this e-mail - no password will be created.<br><br>

Sincerely,<br>
The {{domain}} Team.</p>
"""

# French templates
EMAIL_SUBJECT_FR = "Configurer un mot de passe pour votre nouveau compte sur {domain}"

CREATE_PASSWORD_MESSAGE_FR = """Bonjour, 

Vous avez été invité à accéder à l'IASO - {protocol}://{domain}.

Nom d'utilisateur: {userName}

Pour configurer un mot de passe pour votre compte, merci de cliquer sur le lien ci-dessous :

{url}

Si le lien ne fonctionne pas, merci de copier et coller l'URL dans une nouvelle fenêtre de votre navigateur.

Si vous n'avez pas demandé de compte sur {account_name}, vous pouvez ignorer cet e-mail - aucun mot de passe ne sera créé.

Cordialement,
L'équipe {domain}.
"""

CREATE_PASSWORD_HTML_MESSAGE_FR = """<p>Bonjour,<br><br>

Vous avez été invité à accéder à l'IASO - <a href="{{protocol}}://{{domain}}" target="_blank">{{account_name}}</a>.<br><br>

Nom d'utilisateur: <strong>{{userName}}</strong><br><br>

Pour configurer un mot de passe pour votre compte, merci de cliquer sur le lien ci-dessous :<br><br>

<a href="{{url}}" target="_blank">{{url}}</a><br><br>

Si le lien ne fonctionne pas, merci de copier et coller l'URL dans une nouvelle fenêtre de votre navigateur.<br><br>

Si vous n'avez pas demandé de compte sur {{account_name}}, vous pouvez ignorer cet e-mail - aucun mot de passe ne sera créé.<br><br>

Cordialement,<br>
L'équipe {{domain}}.</p>
"""
