# Modifier les unités d'organisation d'une source de données via l'API

Ce guide s'adresse à une organisation externe qui doit créer et mettre à jour des unités
d'organisation dans une source de données IASO depuis ses propres systèmes, en Python. Il couvre les
deux voies d'écriture offertes par IASO — la **modification directe** et les **demandes de
changement** — comment choisir entre les deux, ainsi que les contraintes et les pièges que vous
rencontrerez.

Tout ce qui suit est du JSON sur HTTPS. Les exemples utilisent
[`requests`](https://requests.readthedocs.io/) ; rien d'autre n'est nécessaire.

## Les deux voies d'écriture

| | Modification directe | Demande de changement |
|---|---|---|
| Points d'entrée | `POST /api/orgunits/create_org_unit/`, `PATCH /api/orgunits/<id>/` | `POST /api/orgunits/changes/` |
| Effet | Appliqué immédiatement à la pyramide | Enregistré comme proposition, appliqué seulement après approbation |
| Permission requise | `iaso_org_units` | Aucune, au-delà d'être authentifié et de voir l'unité d'organisation |
| Revue humaine | Non | Oui — par un utilisateur disposant de `iaso_org_unit_change_request_review` |
| Traçabilité | Journal des modifications | Instantané avant/après complet, approbation champ par champ, commentaire de rejet |
| Peut créer une unité d'organisation | Oui | Pas à elle seule — voir ci-dessous |
| Traitement par lot | Tâche asynchrone de mise à jour groupée | Aucun ; une requête par unité d'organisation |

Utilisez les **demandes de changement** lorsque l'équipe IASO souhaite garder le contrôle éditorial
sur la pyramide : votre système propose, elle décide. Utilisez la **modification directe** lorsque
votre organisation fait autorité sur ces données et qu'on lui fait confiance pour les écrire.

!!! warning "Une demande de changement ne peut pas créer une unité d'organisation à elle seule"
    Toute demande de changement porte sur une unité d'organisation qui **existe déjà** — le champ
    `org_unit_id` est en pratique obligatoire. Pour obtenir une demande de changement de type
    `org_unit_creation`, vous créez d'abord l'unité d'organisation directement avec
    `validation_status: "NEW"`, puis vous soumettez une demande de changement à son sujet. IASO
    détecte que la cible est encore `NEW` et traite la demande comme une création : l'approuver fait
    passer l'unité d'organisation en `VALID`, la rejeter la fait passer en `REJECTED`.

    Cette première étape est une écriture directe : elle exige donc la permission `iaso_org_units`.
    **Un utilisateur sans aucune permission ne peut que proposer des changements sur des unités
    d'organisation existantes, jamais en ajouter de nouvelles.**

## Prérequis

Demandez à l'administrateur IASO du compte :

- un **compte utilisateur dédié** (ne partagez pas les identifiants d'une personne — la traçabilité enregistre l'auteur de chaque changement) ;
- les **permissions** correspondant à la voie que vous comptez emprunter (voir le tableau ci-dessus) ;
- l'**identifiant de la source de données et de la version de source** dans laquelle vous êtes autorisé à écrire ;
- les **identifiants des types d'unité d'organisation** et, le cas échéant, des **groupes** que vous référencerez.

Deux contraintes sont appliquées côté serveur et méritent d'être connues avant de commencer :

- La source de données ne doit pas être marquée **en lecture seule**. Toute écriture dans une source en lecture seule est rejetée.
- Un profil utilisateur peut être restreint à certains **types d'unité d'organisation**
  (`editable_org_unit_types`) et à une **branche de la hiérarchie**. Si c'est votre cas, vous ne
  pouvez toucher que ce qui entre dans ces limites, et vous ne pouvez pas créer d'unité racine.

## Authentification

IASO délivre des JSON Web Tokens. Envoyez vos identifiants à `/api/token/`, puis transmettez le token
`access` reçu comme bearer token sur tous les appels suivants.

```python
import requests

SERVER = "https://iaso.example.org"

r = requests.post(
    f"{SERVER}/api/token/",
    json={"username": "mon-compte-de-service", "password": "..."},
    timeout=30,
)
r.raise_for_status()
tokens = r.json()  # {"access": "...", "refresh": "..."}

headers = {"Authorization": f"Bearer {tokens['access']}"}
```

Les tokens d'accès ont une longue durée de vie sur un déploiement IASO par défaut, mais ne comptez
pas dessus : traitez les `401` en rafraîchissant le token.

```python
r = requests.post(f"{SERVER}/api/token/refresh/", json={"refresh": tokens["refresh"]}, timeout=30)
tokens = r.json()  # un nouveau "access", et un "refresh" pivoté
```

!!! note "Déploiements avec authentification unique (SSO)"
    Certaines instances IASO désactivent complètement la connexion par mot de passe, et sur celles-ci
    `/api/token/` n'existe pas. Un utilisateur déjà authentifié dans le navigateur peut alors appeler
    `GET /api/apitoken/` pour obtenir un token. Cela ne peut pas être scripté à partir d'un nom
    d'utilisateur et d'un mot de passe — demandez à l'administrateur comment l'accès machine est
    prévu sur votre instance.

### Un petit client comme socle

La suite de ce guide s'appuie sur cet utilitaire, qui rafraîchit le token à son expiration et lève
une erreur lisible quand IASO rejette une charge utile.

```python
import requests


class IasoError(Exception):
    pass


class IasoClient:
    def __init__(self, server, username, password):
        self.server = server.rstrip("/")
        self.session = requests.Session()
        self._username = username
        self._password = password
        self._login()

    def _login(self):
        r = self.session.post(
            f"{self.server}/api/token/",
            json={"username": self._username, "password": self._password},
            timeout=30,
        )
        r.raise_for_status()
        tokens = r.json()
        self._refresh_token = tokens["refresh"]
        self.session.headers["Authorization"] = f"Bearer {tokens['access']}"

    def _refresh(self):
        r = self.session.post(
            f"{self.server}/api/token/refresh/",
            json={"refresh": self._refresh_token},
            timeout=30,
        )
        if r.status_code != 200:  # le token de rafraîchissement a lui-même expiré
            self._login()
            return
        tokens = r.json()
        self._refresh_token = tokens.get("refresh", self._refresh_token)
        self.session.headers["Authorization"] = f"Bearer {tokens['access']}"

    def request(self, method, path, **kwargs):
        kwargs.setdefault("timeout", 60)
        url = f"{self.server}{path}"
        r = self.session.request(method, url, **kwargs)
        if r.status_code == 401:
            self._refresh()
            r = self.session.request(method, url, **kwargs)
        if r.status_code >= 400:
            raise IasoError(f"{method} {path} -> {r.status_code}: {r.text}")
        return r.json() if r.content else None

    def get(self, path, **kw):
        return self.request("GET", path, **kw)

    def post(self, path, **kw):
        return self.request("POST", path, **kw)

    def patch(self, path, **kw):
        return self.request("PATCH", path, **kw)
```

## Trouver les identifiants nécessaires

Toute écriture référence une version de source, un type d'unité d'organisation, et éventuellement des
groupes et un parent — tous par identifiant numérique. Récupérez-les une fois au début de votre
traitement.

Notez que chaque point d'entrée IASO encapsule ses résultats sous sa propre clé. Elles ne sont pas
homogènes : lisez les exemples attentivement.

```python
iaso = IasoClient(SERVER, USERNAME, PASSWORD)

# Les sources de données visibles, avec leurs versions et leur version par défaut.
sources = iaso.get("/api/datasources/")["sources"]
for source in sources:
    print(source["id"], source["name"], "lecture seule :", source["read_only"])
    print("  version par défaut :", source["default_version"])
    print("  versions :", [(v["id"], v["number"]) for v in source["versions"]])

# Les types d'unité d'organisation, avec l'id à passer dans org_unit_type_id.
types = iaso.get("/api/orgunittypes/")["orgUnitTypes"]
type_by_name = {t["name"]: t["id"] for t in types}

# Les groupes. Un groupe appartient à une version de source, et une unité d'organisation
# ne peut rejoindre qu'un groupe qui vit dans sa propre version.
groups = iaso.get("/api/groups/")["groups"]
```

C'est l'**identifiant de la version de source** qui compte pour les écritures, pas celui de la source
de données. Une source de données est un conteneur ; une version de source est un instantané daté de
la pyramide qu'elle contient, et une unité d'organisation appartient à exactement une version. Si
vous omettez `version_id` à la création, IASO utilise la **version par défaut de votre compte** — ce
qui est généralement le comportement voulu quand vous écrivez dans la pyramide principale du compte,
mais soyez explicite au moindre doute.

## Lire les unités d'organisation

```python
# Chercher un établissement de santé par son nom dans la pyramide par défaut.
result = iaso.get("/api/orgunits/", params={
    "version": 5,                 # identifiant de la version de source
    "search": "Kalémie",
    "validation_status": "all",
    "limit": 50,
    "page": 1,
})
```

Trois choses font trébucher tout le monde ici.

**La liste est filtrée sur `VALID` par défaut.** Si vous ne passez pas `validation_status`, les unités
d'organisation encore en `NEW` ou passées en `REJECTED` sont invisibles — y compris celles que vous
venez de créer. Passez `validation_status=all`, ou une liste explicite séparée par des virgules comme
`NEW,VALID`.

**L'enveloppe de la réponse change selon que vous paginez ou non.** Avec un `limit`, vous obtenez
`{"count": …, "orgunits": [...], "has_next": …, "page": …, "pages": …}` — notez le `orgunits` en
minuscules. Sans `limit`, vous obtenez l'ensemble des résultats sous `{"orgUnits": [...]}` — en
camelCase. Passez toujours `limit` et paginez ; c'est à la fois plus sûr et moins coûteux.

**`search` accepte des préfixes pour les recherches exactes**, ce qui vous permet de résoudre vos
propres identifiants en identifiants IASO sans correspondance approximative :

- `search=ids:12,13,14` — par identifiant IASO
- `search=refs:ABC-001,ABC-002` — par `source_ref`, la référence externe que vous maîtrisez
- `search=codes:XYZ` — par `code`

Pour une seule unité d'organisation : `GET /api/orgunits/<id>/`.

!!! tip "Si votre système parle FHIR"
    IASO expose également les unités d'organisation sous forme de ressources FHIR R4 `Location`, en
    lecture seule. Si vous intégrez un système qui consomme déjà du FHIR, voyez [lire les unités
    d'organisation via l'API FHIR](../read_org_units_via_fhir/read_org_units_via_fhir.md). C'est une
    voie de lecture uniquement — toutes les écritures passent par les points d'entrée décrits
    ci-dessous.

## Voie A — modifier directement les unités d'organisation

Exige la permission `iaso_org_units`.

### Créer

```python
new_org_unit = iaso.post("/api/orgunits/create_org_unit/", json={
    "name": "Centre de Santé de Kalémie",
    "org_unit_type_id": type_by_name["Health facility"],
    "parent_id": 4321,
    "version_id": 5,                    # optionnel ; par défaut, la version par défaut du compte
    "source_ref": "ABC-001",            # votre propre identifiant — renseignez-le, il vous servira
    "code": "CS-KAL-001",
    "short_name": "CS Kalémie",
    "aliases": ["Kalemie Health Centre"],
    "validation_status": "VALID",       # vaut "NEW" si omis
    "opening_date": "01-03-2019",       # jj-mm-aaaa — voir l'avertissement ci-dessous
    "latitude": -5.9236,
    "longitude": 29.1947,
    "altitude": 0,
    "groups": [12, 15],
})
print(new_org_unit["id"])
```

Seuls `name` et `org_unit_type_id` sont obligatoires. Quelques règles appliquées par le serveur :

- `parent_id` doit vivre dans la **même version de source** que l'unité d'organisation créée.
- Chaque groupe de `groups` doit également vivre dans cette même version de source.
- `code` doit être unique parmi les unités d'organisation valides de la version. Un conflit renvoie un
  `400` avec `errorKey: "code"`.
- Si votre profil est restreint à une branche de la hiérarchie, `parent_id` est obligatoire — vous ne
  pouvez pas créer de racine.

Pour un polygone plutôt qu'un point, passez `geom` sous forme d'objet géométrie GeoJSON :

```python
"geom": {"type": "MultiPolygon", "coordinates": [[[[29.1, -5.9], [29.2, -5.9], [29.2, -6.0], [29.1, -5.9]]]]},
```

!!! warning "À la création, les dates sont en `jj-mm-aaaa`, et uniquement ainsi"
    `POST /api/orgunits/create_org_unit/` analyse `opening_date` et `closed_date` avec le seul format
    `%d-%m-%Y`. Une date ISO comme `2019-03-01` provoque une erreur serveur, et non un `400` propre.
    De façon déroutante, `PATCH` est permissif et accepte `jj-mm-aaaa`, `jj/mm/aaaa`, `aaaa-mm-jj` et
    `aaaa/mm/jj`, tandis que les demandes de changement attendent de l'**ISO `aaaa-mm-jj`**. Formatez
    la date selon le point d'entrée que vous appelez.

    Autre point : si vous envoyez `closed_date` à la création sans `opening_date`, la comparaison
    entre les deux échoue côté serveur. Envoyez toujours les deux, ou aucun.

### Mettre à jour

`PATCH /api/orgunits/<id>/` ne met à jour que les clés présentes dans le corps de la requête. Tout est
optionnel.

```python
iaso.patch(f"/api/orgunits/{org_unit_id}/", json={
    "name": "Centre de Santé de Kalémie Centre",
    "parent_id": 4322,
    "org_unit_type_id": type_by_name["Health facility"],
    "groups": [12, 15],            # remplace toute la liste, ce n'est pas un ajout
    "opening_date": "2019-03-01",  # PATCH accepte aussi l'ISO
    "code": "CS-KAL-001",
    "aliases": ["Kalemie Health Centre"],
})
```

À noter :

- **`groups` remplace toute la liste.** Pour ajouter un seul groupe, relisez les groupes actuels et
  renvoyez-les tous.
- **Les coordonnées voyagent en trio.** Pour définir une position, envoyez `latitude`, `longitude`
  *et* `altitude` ensemble — le point d'entrée lit les trois clés, et omettre `altitude` en envoyant
  les deux autres provoque une erreur serveur. Envoyez `latitude: None, longitude: None,
  altitude: None` pour effacer la position.
- **`version_id` ne peut pas être modifié par `PATCH`.** Une unité d'organisation ne peut pas être
  déplacée d'une version de source à une autre via cette API.
- Un `name` vide est silencieusement ignoré plutôt qu'appliqué — vous ne pouvez pas effacer un nom.

### Changer le statut de validation

```python
iaso.patch(f"/api/orgunits/{org_unit_id}/", json={"validation_status": "VALID"})
```

Les valeurs acceptées sont `NEW`, `VALID` et `REJECTED`.

### Mises à jour groupées

Pour un changement qui s'applique uniformément à de nombreuses unités d'organisation — même type,
mêmes groupes, même statut de validation — il existe une tâche asynchrone, préférable à une boucle
d'appels `PATCH`.

```python
task = iaso.post("/api/tasks/create/orgunitsbulkupdate/", json={
    "selected_ids": [101, 102, 103],
    "validation_status": "VALID",
    "groups_added": [15],
    "groups_removed": [12],
})["task"]

# Interroger jusqu'à la fin.
import time
while True:
    status = iaso.get(f"/api/tasks/{task['id']}/")
    if status["status"] in ("SUCCESS", "ERRORED", "KILLED"):
        print(status["status"], status.get("result"))
        break
    time.sleep(5)
```

Vous pouvez cibler une recherche plutôt qu'une liste explicite en passant `select_all: true` avec
`searches` (les mêmes objets de filtre que ceux acceptés par le point d'entrée de liste) et un
`unselected_ids` optionnel. Cette tâche ne peut ni renommer ni déplacer les unités d'organisation :
elle ne fait que définir le type, les groupes et le statut de validation.

## Voie B — soumettre des demandes de changement

Créer une demande de changement n'exige aucune permission particulière — seulement d'être authentifié
et que l'unité d'organisation ciblée vous soit visible. Ce que vous soumettez est une *proposition* :
elle ne change rien tant qu'un relecteur IASO ne l'a pas approuvée.

### Soumettre

```python
import uuid

change_request = iaso.post("/api/orgunits/changes/", json={
    "uuid": str(uuid.uuid4()),        # optionnel mais recommandé, voir ci-dessous
    "org_unit_id": 1234,              # l'unité d'organisation à modifier — obligatoire
    "new_name": "Centre de Santé de Kalémie Centre",
    "new_org_unit_type_id": type_by_name["Health facility"],
    "new_parent_id": 4322,
    "new_groups": [12, 15],
    "new_location": {"latitude": -5.9236, "longitude": 29.1947, "altitude": 0},
    "new_opening_date": "2019-03-01",  # ISO ici
    "new_closed_date": "2030-12-31",
})
print(change_request["id"], change_request["status"])  # -> 42 new
```

Les champs que vous pouvez proposer sont exactement ceux-ci :

| Champ | Forme |
|---|---|
| `new_name` | chaîne |
| `new_parent_id` | id d'unité d'organisation (ou uuid), nullable |
| `new_org_unit_type_id` | id de type d'unité d'organisation |
| `new_groups` | liste d'ids de groupes — remplace toute la liste |
| `new_location` | `{"latitude": …, "longitude": …, "altitude": …}`, nullable |
| `new_location_accuracy` | décimal, en mètres — métadonnée seulement, jamais appliquée à l'unité d'organisation |
| `new_opening_date` | date ISO `aaaa-mm-jj` |
| `new_closed_date` | date ISO `aaaa-mm-jj` |
| `new_reference_instances` | liste d'ids de soumissions de formulaire (ou uuids) |

Les règles appliquées par le serveur :

- **Au moins un champ `new_*` est requis.** Une demande autrement vide renvoie un `400`.
- N'envoyez que les champs que vous voulez réellement changer. IASO déduit la liste des champs
  demandés à partir des clés présentes dans votre charge utile, et le relecteur les approuve un à un.
  N'envoyez pas un instantané complet de l'unité d'organisation — chaque champ inclus devient un
  changement que quelqu'un devra arbitrer.
- Envoyer explicitement `null` signifie *effacer cette valeur*, ce qui est différent d'omettre la clé.
- `new_parent_id` doit être dans la même version de source que l'unité d'organisation, et ne peut pas
  être l'un de ses propres descendants.
- `new_closed_date` doit être strictement postérieure à `new_opening_date`.

### Idempotence

L'`uuid` que vous fournissez est la clé de déduplication : soumettre une demande de changement dont
l'`uuid` existe déjà est sans effet et renvoie la demande existante plutôt que d'en créer un doublon.
Dérivez-le de manière déterministe depuis votre propre enregistrement — par exemple
`uuid.uuid5(NAMESPACE, f"{source_ref}:{content_hash}")` — et une reprise après une panne réseau
devient sans risque.

### Proposer une nouvelle unité d'organisation

Comme expliqué en tête de guide, une demande de changement ne peut pas faire apparaître une unité
d'organisation. Le schéma en deux temps est le suivant :

```python
# 1. La créer directement, non validée. Exige iaso_org_units.
draft = iaso.post("/api/orgunits/create_org_unit/", json={
    "name": "Nouveau Poste de Santé",
    "org_unit_type_id": type_by_name["Health facility"],
    "parent_id": 4321,
    "source_ref": "ABC-042",
    "validation_status": "NEW",     # <- la maintient hors de la pyramide active
})

# 2. Soumettre la demande de changement. IASO voit que l'unité est encore NEW
#    et enregistre la demande avec le type "org_unit_creation".
iaso.post("/api/orgunits/changes/", json={
    "org_unit_id": draft["id"],
    "new_name": "Nouveau Poste de Santé",
    "new_location": {"latitude": -5.93, "longitude": 29.20, "altitude": 0},
})
```

L'approbation fait passer l'unité d'organisation en `VALID` et elle entre dans la pyramide. Le rejet la
fait passer en `REJECTED` et elle en reste exclue.

### Il n'y a pas de création groupée

`POST /api/orgunits/changes/` ne prend qu'une demande de changement à la fois. Pour cent unités
d'organisation, faites cent appels — séquentiellement, ou avec un petit pool de threads, mais
n'attendez pas de point d'entrée par lot. (La *revue* groupée existe, mais c'est le côté du relecteur,
pas le vôtre.)

### Suivre le sort de vos demandes

```python
page = 1
while True:
    resp = iaso.get("/api/orgunits/changes/", params={
        "status": "new,approved,rejected",
        "created_at_after": "2026-01-01",
        "limit": 50,
        "page": page,
    })
    for cr in resp["results"]:
        print(cr["id"], cr["status"], cr["org_unit"]["name"], cr.get("rejection_comment"))
    if not resp["has_next"]:
        break
    page += 1
```

Le point d'entrée de liste pagine sous `results`. Une demande de changement est `new` jusqu'à ce que
quelqu'un la relise, puis `approved` ou `rejected` ; un rejet est toujours accompagné d'un
`rejection_comment` qui en explique la raison. Filtres utiles : `org_unit_id`, `source_version_id`,
`status`, `created_at_after` / `created_at_before`, `kind`, `requested_fields`.

Un relecteur peut approuver certains champs et en rejeter d'autres : vérifiez donc `approved_fields`
sur une demande approuvée plutôt que de supposer que tout ce que vous avez proposé a été appliqué.

## Erreurs

Les points d'entrée des unités d'organisation ne renvoient pas un objet d'erreur au format DRF. Sur un
`400`, ils renvoient une **liste** :

```json
[
  {"errorKey": "code", "errorMessage": "Another valid OrgUnit already exists with the code 'CS-KAL-001' in this version"},
  {"errorKey": "parent_id", "errorMessage": "Parent is not in the same version"}
]
```

Le point d'entrée des demandes de changement, qui repose sur un sérialiseur DRF standard, renvoie la
forme habituelle `{"champ": ["message"]}`, parfois avec le message sous `non_field_errors`. Gérez les
deux.

```python
def explain(err: IasoError) -> str:
    import json
    body = str(err).split(": ", 2)[-1]
    try:
        payload = json.loads(body)
    except ValueError:
        return body
    if isinstance(payload, list):     # points d'entrée des unités d'organisation
        return "; ".join(f"{e['errorKey']}: {e['errorMessage']}" for e in payload)
    return "; ".join(f"{k}: {v}" for k, v in payload.items())   # demandes de changement
```

Ne réessayez pas aveuglément un `400` — c'est une charge utile rejetée, et elle le sera de nouveau.
Réessayez les `502`, `503` et `504`, et rendez vos écritures idempotentes (un `uuid` stable pour les
demandes de changement, une recherche sur `source_ref` avant de créer) afin qu'une reprise après un
délai d'attente dépassé ne puisse pas écrire deux fois.

## Un exemple complet : synchroniser un CSV d'établissements

Le script ci-dessous lit un CSV exporté de votre propre système, rapproche chaque ligne d'IASO via le
`source_ref`, puis crée ce qui manque et met à jour ce qui a divergé. La même logique fonctionne dans
les deux modes : `direct` écrit directement dans la pyramide, `change_request` propose.

```python
"""Synchronise un CSV d'établissements de santé dans une source de données IASO.

Utilisation :
    python sync_org_units.py etablissements.csv direct
    python sync_org_units.py etablissements.csv change_request

Colonnes CSV : source_ref, name, parent_ref, type, latitude, longitude, opening_date (aaaa-mm-jj)
"""

import csv
import sys
import uuid

# IasoClient et IasoError tels que définis plus haut dans ce guide.
from iaso_client import IasoClient, IasoError

SERVER = "https://iaso.example.org"
USERNAME = "mon-compte-de-service"
PASSWORD = "..."
VERSION_ID = 5          # la version de source dans laquelle vous écrivez
NAMESPACE = uuid.UUID("6c1f0e6e-0f1a-4c6e-9f4a-2b7d0a1f0000")  # un uuid fixe de votre choix


def load_existing(iaso, version_id):
    """Toutes les unités d'organisation de la version, indexées par source_ref."""
    by_ref, page = {}, 1
    while True:
        resp = iaso.get("/api/orgunits/", params={
            "version": version_id,
            "validation_status": "all",   # sinon les unités NEW et REJECTED sont invisibles
            "limit": 500,
            "page": page,
        })
        for org_unit in resp["orgunits"]:
            if org_unit.get("source_ref"):
                by_ref[org_unit["source_ref"]] = org_unit
        if not resp["has_next"]:
            return by_ref
        page += 1


def load_types(iaso):
    return {t["name"]: t["id"] for t in iaso.get("/api/orgunittypes/")["orgUnitTypes"]}


def has_drifted(row, existing, type_ids, parent_id):
    """Les champs où le CSV diverge d'IASO, exprimés dans le vocabulaire d'IASO."""
    changes = {}
    if row["name"] != existing["name"]:
        changes["name"] = row["name"]
    if type_ids[row["type"]] != existing.get("org_unit_type_id"):
        changes["org_unit_type_id"] = type_ids[row["type"]]
    if parent_id != existing.get("parent_id"):
        changes["parent_id"] = parent_id
    if row.get("latitude") and row.get("longitude"):
        lat, lon = float(row["latitude"]), float(row["longitude"])
        if (existing.get("latitude"), existing.get("longitude")) != (lat, lon):
            changes["latitude"], changes["longitude"] = lat, lon
    return changes


def to_iso(date_str):        # PATCH et les demandes de changement acceptent tous deux l'ISO
    return date_str or None


def to_ddmmyyyy(date_str):   # create_org_unit n'accepte que jj-mm-aaaa
    if not date_str:
        return None
    year, month, day = date_str.split("-")
    return f"{day}-{month}-{year}"


def create_direct(iaso, row, type_ids, parent_id):
    return iaso.post("/api/orgunits/create_org_unit/", json={
        "name": row["name"],
        "org_unit_type_id": type_ids[row["type"]],
        "parent_id": parent_id,
        "version_id": VERSION_ID,
        "source_ref": row["source_ref"],
        "validation_status": "VALID",
        "opening_date": to_ddmmyyyy(row.get("opening_date")),
        "latitude": float(row["latitude"]) if row.get("latitude") else None,
        "longitude": float(row["longitude"]) if row.get("longitude") else None,
        "altitude": 0,
    })


def update_direct(iaso, org_unit, changes):
    payload = dict(changes)
    if "latitude" in payload:
        payload["altitude"] = 0       # le point d'entrée lit les trois clés ensemble
    return iaso.patch(f"/api/orgunits/{org_unit['id']}/", json=payload)


def create_as_change_request(iaso, row, type_ids, parent_id):
    """Créer l'unité d'organisation non validée, puis la proposer. Exige iaso_org_units."""
    draft = iaso.post("/api/orgunits/create_org_unit/", json={
        "name": row["name"],
        "org_unit_type_id": type_ids[row["type"]],
        "parent_id": parent_id,
        "version_id": VERSION_ID,
        "source_ref": row["source_ref"],
        "validation_status": "NEW",
        "opening_date": to_ddmmyyyy(row.get("opening_date")),
    })
    return submit_change_request(iaso, draft["id"], row, {
        "name": row["name"],
        "latitude": float(row["latitude"]) if row.get("latitude") else None,
        "longitude": float(row["longitude"]) if row.get("longitude") else None,
    })


def submit_change_request(iaso, org_unit_id, row, changes):
    """Traduire les champs divergents dans le vocabulaire des demandes de changement."""
    payload = {
        "uuid": str(uuid.uuid5(NAMESPACE, f"{row['source_ref']}:{sorted(changes.items())}")),
        "org_unit_id": org_unit_id,
    }
    if "name" in changes:
        payload["new_name"] = changes["name"]
    if "org_unit_type_id" in changes:
        payload["new_org_unit_type_id"] = changes["org_unit_type_id"]
    if "parent_id" in changes:
        payload["new_parent_id"] = changes["parent_id"]
    if changes.get("latitude") is not None:
        payload["new_location"] = {
            "latitude": changes["latitude"],
            "longitude": changes["longitude"],
            "altitude": 0,
        }
    if row.get("opening_date"):
        payload["new_opening_date"] = to_iso(row["opening_date"])
    return iaso.post("/api/orgunits/changes/", json=payload)


def main(csv_path, mode):
    iaso = IasoClient(SERVER, USERNAME, PASSWORD)
    type_ids = load_types(iaso)
    existing = load_existing(iaso, VERSION_ID)

    created = updated = unchanged = failed = 0

    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            parent = existing.get(row.get("parent_ref"))
            parent_id = parent["id"] if parent else None
            current = existing.get(row["source_ref"])

            try:
                if current is None:
                    if mode == "direct":
                        create_direct(iaso, row, type_ids, parent_id)
                    else:
                        create_as_change_request(iaso, row, type_ids, parent_id)
                    created += 1
                    continue

                changes = has_drifted(row, current, type_ids, parent_id)
                if not changes:
                    unchanged += 1
                    continue

                if mode == "direct":
                    update_direct(iaso, current, changes)
                else:
                    submit_change_request(iaso, current["id"], row, changes)
                updated += 1

            except IasoError as e:
                failed += 1
                print(f"ÉCHEC {row['source_ref']} : {e}", file=sys.stderr)

    verbe = "créées" if mode == "direct" else "proposées"
    print(f"{verbe} : {created}, mises à jour : {updated}, inchangées : {unchanged}, échecs : {failed}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
```

Deux habitudes que ce script illustre et qu'il vaut la peine de conserver :

**Portez toujours votre propre identifiant dans `source_ref`.** C'est la clé de jointure entre votre
système et IASO, elle survit aux renommages, et elle vous permet de rejouer la synchronisation sans
créer de doublons. IASO créera volontiers deux unités d'organisation portant le même nom.

**Construisez les parents avant les enfants.** Le script ci-dessus résout un parent parmi les unités
d'organisation déjà présentes dans IASO : un CSV doit donc être trié du haut vers le bas — un
établissement dont le district n'existe pas encore se retrouve avec un parent `null`. Si vous importez
une hiérarchie entière, traitez-la niveau par niveau.

## Autres voies d'import en masse

Si vous chargez une pyramide entière plutôt que d'en maintenir une, deux routes d'import plus lourdes
existent et conviennent généralement mieux. Toutes deux exigent la permission `iaso_sources`, toutes
deux s'exécutent en tâche de fond, et toutes deux sont documentées avec les écrans d'administration
des sources de données :

- `POST /api/tasks/create/importgpkg/` — téléverser un GeoPackage dans une source de données et un numéro de version.
- `POST /api/dhis2ouimporter/` — importer ou rafraîchir la pyramide directement depuis une instance DHIS2.

## Aide-mémoire des pièges

- La liste des unités d'organisation filtre sur `validation_status=VALID` par défaut ; passez `all` pour voir ce que vous venez de créer.
- L'enveloppe de la liste est `orgunits` avec pagination, `orgUnits` sans.
- Dates : `jj-mm-aaaa` à la création, à peu près n'importe quoi de raisonnable en `PATCH`, ISO `aaaa-mm-jj` dans les demandes de changement.
- À la création, n'envoyez jamais `closed_date` sans `opening_date`.
- Latitude, longitude et altitude sont lues comme un trio, aussi bien en `PATCH` que dans `new_location`.
- `groups` et `new_groups` remplacent toute la liste ; ils n'ajoutent pas.
- Un parent et un groupe doivent appartenir à la même version de source que l'unité d'organisation.
- `version_id` est fixé une fois, à la création, et ne peut jamais être modifié par `PATCH`.
- Une demande de changement exige toujours un `org_unit_id` existant, et il n'existe pas de création groupée.
