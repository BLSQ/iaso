# Tests de scénarios

Un scénario rejoue ce que fait l'application IASO avec un workflow d'entités, sans téléphone et sans rien enregistrer :
enregistrer une entité avec des réponses, vérifier les formulaires proposés ensuite, en remplir un, vérifier ce que
deviennent les informations de l'entité. Un scénario de formulaire vérifie un formulaire seul : ce que donnent ses
calculs, ou qu'il refuse certaines réponses (questions obligatoires, contraintes, choix).

Les workflows sont configurés sur le serveur mais évalués uniquement par l'application (conditions de suivi, copie des
réponses d'un formulaire de suivi vers l'entité) : une erreur est souvent découverte sur le terrain. Les scénarios la
trouvent avant la publication.

## Fonctionnement

- Les formulaires sont remplis par `odk_cli`, le moteur de formulaires de l'application IASO (JavaRosa), installé dans
  les images Docker (linux/amd64).
- La logique du workflow (suivis proposés, typage des réponses sur le téléphone, pré-remplissage, copies) est reproduite
  en Python (`iaso/scenarios/`), y compris les particularités du téléphone.
- Une exécution n'enregistre que le dernier résultat du scénario : ni entité, ni soumission.

## Écrire un scénario

Les scénarios sont des fichiers JSON (`"format": "iaso-scenarios/1"`), validés par le JSON Schema servi par
`GET /api/scenarios/schema/` (à utiliser comme `"$schema"` dans un éditeur). Réponses et valeurs attendues sont
toujours du texte, comme dans une soumission (`"11"`, `"yes"`). Exemples : `iaso/tests/scenarios/examples/`.

La première étape d'un scénario d'entité remplit le formulaire de référence du type d'entité. Les formulaires sont
désignés par leur `form_id`.
Le `at` d'une étape est le jour où elle a lieu : l'application évalue les suivis à l'ouverture de l'entité, une étape
se voit donc proposer ce que ce jour-là propose (sans `at` : le jour de l'exécution).
Le formulaire est aussi rempli ce jour-là, comme l'application le démarre (valeurs par défaut, puis pré-remplissage,
puis réponses) : ses `today()` et `now()` - une date par défaut comprise - valent la date et l'heure de l'étape (réécrits
dans le XForm, pour les exécutions et dans l'éditeur) ; les métadonnées `today`, `start` et `end` gardent l'horloge réelle.

Quand le type d'entité a une recherche de doublons (`fields_duplicate_search`), l'application la demande avant le
formulaire d'enregistrement, et les valeurs saisies ou scannées (le QR code d'une carte) pré-remplissent le formulaire,
questions en lecture seule comprises. La première étape les donne dans `search` :
`{"form": "registration", "search": {"qr_code": "CARD-0001"}, "answers": {...}}`. Avec
`prevent_add_if_duplicate_found`, l'application n'enregistre que si toutes les questions de recherche sont remplies.
Pour essayer : `docker compose run --rm iaso manage seed_cps_workflow --account 1` (enregistrement sur carte QR, quatre
cycles).

## Exécuter des scénarios

- Dans l'interface web : le panneau **Scénarios** d'une version de workflow (brouillon ou publiée) importe les fichiers,
  les exécute sur cette version et explique les échecs ; les détails techniques (pré-remplissage, formulaire rempli,
  conditions de suivi avec les valeurs lues) sont derrière « Voir le résultat ».
- API : `POST /api/scenarios/run/` avec `{"scenario_ids": [...], "workflow_version_id": 12}` (la version est
  optionnelle : par défaut, la version publiée). Exécutions synchrones, limitées par `SCENARIOS_SYNC_MAX_STEPS`.
- Ligne de commande (CI, pipelines), en lecture seule, en erreur si un scénario échoue :
  `docker compose run --rm iaso manage run_scenarios --account 1 [--workflow-version 12] [--report report.md]`.

Permission : `iaso_workflows`.

## Limites connues

- Une entité par scénario ; un scénario mêlant plusieurs types d'entités et des formulaires simples est prévu.
- La recherche ne trouve rien (l'entité du scénario n'est pas enregistrée avant) : retrouver une entité existante n'est pas encore testé.
- Pas encore de synchronisation, de cartes NFC, ni de choix de rôle ou d'unité d'organisation (le `context` d'une étape
  donne des valeurs par nom de question).
