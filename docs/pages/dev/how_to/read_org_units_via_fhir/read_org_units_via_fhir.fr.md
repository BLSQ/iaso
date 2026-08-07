# Lire les unités d'organisation via l'API FHIR

IASO expose ses unités d'organisation sous forme de ressources **FHIR R4 `Location`**, à destination
des systèmes externes qui parlent déjà FHIR. Ce guide documente cette API telle qu'elle est réellement
implémentée.

C'est une API **en lecture seule** : elle ne sert que du `GET`, et il n'existe aucun moyen de créer ou
de modifier une unité d'organisation par son intermédiaire. Pour écrire, voyez le [guide de
modification des unités d'organisation via
l'API](../modify_org_units_via_api/modify_org_units_via_api.md).

## Ce qui est implémenté, et ce qui ne l'est pas

Ayez une vision lucide du périmètre avant de bâtir une intégration dessus.

**Implémenté :** la ressource `Location` (lecture et recherche), une opération `children`, un
`CapabilityStatement`, des réponses `Bundle` de type `searchset`, et des `OperationOutcome` en cas
d'erreur.

**Non implémenté :** toute autre ressource FHIR — il n'y a pas de point d'entrée `Organization`,
`Patient`, `Encounter`, `Observation` ni `QuestionnaireResponse`. Aucune écriture
(`POST`/`PUT`/`PATCH`/`DELETE`). Pas de `_include`, `_revinclude`, `_sort`, `_elements`, `_summary`,
`_lastUpdated`, ni de paramètres chaînés ou de modificateurs comme `:exact` et `:contains`. Pas de
XML, ni de paramètre `_format`. Aucune opération FHIR au-delà de `children`.

En pratique, il s'agit d'une vue en lecture de la pyramide des unités d'organisation, de forme FHIR,
et non d'un serveur FHIR complet. Si votre client est un client FHIR générique et strict, lisez
d'abord la section « Réserves de conformité » en fin de page : plusieurs réponses ne passeront pas la
validation.

## Points d'entrée

Les routes FHIR vivent sous le préfixe `/api/` d'IASO, comme tous les autres points d'entrée.

| Méthode | Chemin | Renvoie |
|---|---|---|
| `GET` | `/api/fhir/Location/` | un `Bundle` (`searchset`) de ressources `Location` |
| `GET` | `/api/fhir/Location/{id}/` | une seule `Location` |
| `GET` | `/api/fhir/Location/{id}/children/` | un `Bundle` des enfants **directs** de cette location |
| `GET` | `/api/fhir/Location/metadata/` | un `CapabilityStatement` |

!!! warning "Le chemin de base est `/api/fhir/`, et non `/fhir/`"
    Le `README.md` du module, dans `iaso/api/fhir/`, documente l'URL de base comme `/fhir/`. C'est
    faux : le routeur est enregistré dans `iaso/urls.py`, lui-même monté sous `/api/`. Tous les
    chemins sont donc `/api/fhir/Location/…`. Ce même README indique aussi la correspondance des
    statuts à l'envers et écrit les systèmes d'identifiants en `http://` au lieu de `https://` —
    préférez cette page.

Notez que `metadata` se trouve **sous** `Location`, à `/api/fhir/Location/metadata/`. La spécification
FHIR place la déclaration de conformité à la racine du serveur (`/metadata`) ; ce n'est pas le cas
d'IASO. Un client FHIR générique qui découvre la conformité automatiquement ne la trouvera pas.

## Authentification et permissions

L'authentification est le JWT standard d'IASO — les points d'entrée FHIR ne sont ni publics ni dotés
d'identifiants distincts.

```python
import requests

SERVER = "https://iaso.example.org"

r = requests.post(
    f"{SERVER}/api/token/",
    json={"username": "mon-compte-de-service", "password": "..."},
    timeout=30,
)
r.raise_for_status()
headers = {"Authorization": f"Bearer {r.json()['access']}"}
```

L'appelant a besoin de **`iaso_org_units` ou de `iaso_org_units_read`**. La permission en lecture
seule suffit, et c'est celle qu'il convient de demander si vous ne faites que consommer cette API. Les
super-utilisateurs contournent la vérification de permission.

- Non authentifié → `401`.
- Authentifié mais ne détenant aucune des deux permissions → `403`.

### Ce que vous avez le droit de voir

Les résultats sont restreints à l'appelant de deux façons, toutes deux silencieuses :

- **Isolation par compte.** Vous ne voyez jamais que les unités d'organisation de votre propre compte.
  Le statut de super-utilisateur ne contourne pas cette règle.
- **Restriction hiérarchique du profil.** Si l'administrateur IASO a restreint votre profil à une
  branche de la pyramide, vous voyez cette branche et ses descendants, et rien d'autre — ni le parent
  au-dessus, ni les branches sœurs.

Demander une unité d'organisation hors de votre périmètre renvoie **un `404` avec un
`OperationOutcome`, et non un `403`**. L'API ne distingue pas « n'existe pas » de « ne vous appartient
pas », ce qui est délibéré, mais implique qu'un `404` ne prouve pas qu'un identifiant est libre.

## Le Bundle

Les points d'entrée de liste et `children` renvoient tous deux un Bundle `searchset`.

```json
{
  "resourceType": "Bundle",
  "id": "search-results",
  "meta": {"lastUpdated": "2026-07-14T10:30:00.123456+00:00"},
  "type": "searchset",
  "total": 150,
  "link": [
    {"relation": "self", "url": "https://iaso.example.org/api/fhir/Location/?_count=20"},
    {"relation": "next", "url": "https://iaso.example.org/api/fhir/Location/?_count=20&_skip=20"}
  ],
  "entry": [
    {
      "resource": { "resourceType": "Location", "id": "123", "...": "..." },
      "fullUrl": "https://iaso.example.org/api/fhir/Location//123"
    }
  ]
}
```

`total` est le décompte de **l'ensemble** des résultats, pas de la page courante. `link` porte `self`,
plus `next` et `previous` lorsqu'ils existent — suivez `next` plutôt que de calculer les décalages
vous-même. Notez que la relation s'écrit `previous`, et non `prev` comme en FHIR. Pour le point
d'entrée `children`, l'`id` du Bundle vaut `children-{id_du_parent}` au lieu de `search-results`.

Le double slash dans `fullUrl` n'est pas une coquille de ce guide : l'implémentation concatène une URL
de base qui se termine déjà par `/` avec `/{id}`. N'extrayez pas les identifiants de `fullUrl` ; lisez
`entry[].resource.id`.

!!! danger "La pagination n'est pas stable — dédoublonnez par `id`"
    La requête sous-jacente n'a **aucun tri** : `OrgUnit` ne déclare pas d'ordre par défaut et la vue
    FHIR n'en ajoute aucun, alors même que les résultats sont paginés par limite et décalage.
    PostgreSQL est libre de renvoyer les lignes dans un ordre différent à chaque requête : parcourir un
    grand jeu de résultats **peut donc vous montrer deux fois la même unité d'organisation et en
    omettre une autre**. Aucun paramètre `_sort` ne permet d'y remédier.

    Deux parades concrètes, toutes deux employées dans les exemples ci-dessous : demandez la plus
    grande page possible (`_count=100`) pour réduire le nombre d'allers-retours, et **dédoublonnez par
    `id`** au fil de l'eau plutôt que de supposer les pages disjointes. S'il vous faut un instantané
    garanti complet d'une grande pyramide, `/api/orgunits/` est la voie de lecture la plus sûre.

    Tout ce qui tient en une seule page (tout jeu de 100 résultats ou moins, et la plupart des appels
    à `children`) n'est pas concerné.

## La ressource Location

Un exemple complet, pour un établissement de santé doté d'un parent, de coordonnées et de dates :

```json
{
  "resourceType": "Location",
  "id": "123",
  "meta": {
    "versionId": "1",
    "profile": ["https://hl7.org/fhir/StructureDefinition/Location"],
    "lastUpdated": "2026-07-14T10:30:00.123456+00:00"
  },
  "identifier": [
    {"use": "official", "system": "https://openiaso.com/org-unit/Pyramide nationale/source-ref", "value": "HF001"},
    {"use": "secondary", "system": "https://openiaso.com/org-unit/uuid", "value": "country-uuid-123"},
    {"use": "secondary", "system": "https://openiaso.com/org-unit/alias", "value": "TC"}
  ],
  "status": "active",
  "name": "Test Health Facility",
  "mode": "instance",
  "type": [
    {
      "coding": [
        {"system": "https://openiaso.com/org-unit-type", "code": "HF", "display": "Health Facility"}
      ],
      "text": "Health Facility"
    }
  ],
  "physicalType": {
    "coding": [{"system": "https://terminology.hl7.org/CodeSystem/location-physical-type", "code": "bu"}]
  },
  "position": {"longitude": 29.1947, "latitude": -5.9236, "altitude": 0.0},
  "partOf": {"reference": "Location/122", "display": "Test District"},
  "managingOrganization": {"display": "Pyramide nationale"},
  "operationalStatus": {
    "coding": [{"system": "https://terminology.hl7.org/CodeSystem/v2-0116", "code": "O", "display": "Open"}]
  },
  "extension": [
    {"url": "https://openiaso.com/fhir/StructureDefinition/org-unit-validation-status", "valueCode": "VALID"},
    {"url": "https://openiaso.com/fhir/StructureDefinition/org-unit-type-depth", "valueInteger": 3},
    {"url": "https://openiaso.com/fhir/StructureDefinition/source-version", "valueString": "1"},
    {"url": "https://openiaso.com/fhir/StructureDefinition/opening-date", "valueDate": "2019-03-01"}
  ]
}
```

### Champ par champ

| Champ FHIR | Provient de | Notes |
|---|---|---|
| `id` | `OrgUnit.id` | une chaîne, pas un nombre |
| `meta.versionId` | — | figé à `"1"` ; ne suit aucune révision |
| `meta.lastUpdated` | `updated_at` | ISO 8601 |
| `identifier` | `source_ref`, `uuid`, `aliases` | voir ci-dessous |
| `status` | `validation_status` | voir la correspondance ci-dessous — **à lire attentivement** |
| `name` | `name` | |
| `mode` | — | toujours `"instance"` |
| `type[].coding[].code` | `org_unit_type.short_name` | le **nom court**, p. ex. `HF` |
| `type[].coding[].display`, `type[].text` | `org_unit_type.name` | p. ex. `Health Facility` |
| `physicalType` | `org_unit_type.category` | `COUNTRY`→`co`, `REGION`/`DISTRICT`→`area`, `HF`→`bu`, tout le reste→`si` |
| `position` | `location` | `longitude`, `latitude`, et `altitude` quand le point porte un Z |
| `partOf` | `parent` | `{"reference": "Location/<id>", "display": "<nom du parent>"}` |
| `managingOrganization.display` | `version.data_source.name` | une simple chaîne d'affichage — il n'existe aucune ressource `Organization` à référencer |
| `operationalStatus` | `closed_date` / `opening_date` | `C`/Closed si une date de fermeture existe, sinon `O`/Open si une date d'ouverture existe, sinon absent |
| `extension` | statut de validation, profondeur du type, version de source, dates d'ouverture et de fermeture | voir ci-dessous |

Le tableau `identifier` contient jusqu'à trois types d'entrées, et seulement celles qui sont
renseignées :

- la **référence source**, avec `use: "official"` et un système qui incorpore le nom de la source de
  données : `https://openiaso.com/org-unit/{nom de la source}/source-ref`. Le nom étant interpolé dans
  l'URL du système, cette chaîne diffère d'une source à l'autre et peut contenir des espaces.
- l'**uuid IASO**, avec `use: "secondary"` et le système `https://openiaso.com/org-unit/uuid`.
- une entrée **par alias**, avec `use: "secondary"` et le système `https://openiaso.com/org-unit/alias`.

Le tableau `extension` porte les données propres à IASO qui n'ont pas de place en FHIR :

| URL d'extension (préfixe `https://openiaso.com/fhir/StructureDefinition/`) | Valeur | Présente quand |
|---|---|---|
| `org-unit-validation-status` | `valueCode` : `NEW` \| `VALID` \| `REJECTED` | toujours |
| `org-unit-type-depth` | `valueInteger` | le type a une profondeur |
| `source-version` | `valueString` — le **numéro** de version, pas son id | l'unité a une version |
| `opening-date` | `valueDate` | renseignée |
| `closed-date` | `valueDate` | renseignée |

Si le véritable statut de validation IASO vous importe, lisez l'extension
`org-unit-validation-status` plutôt que de le déduire de `status` : c'est la valeur non transformée et
sans ambiguïté.

### La correspondance des statuts

`Location.status` est un code contraint par FHIR : les trois statuts de validation d'IASO y sont donc
comprimés ainsi :

| `validation_status` IASO | `Location.status` FHIR |
|---|---|
| `VALID` | `active` |
| `NEW` | `inactive` |
| `REJECTED` | `suspended` |

!!! danger "C'est contre-intuitif, et le README du module l'indique à l'envers"
    Une unité d'organisation **rejetée** apparaît comme `suspended`, et une unité **nouvelle / pas
    encore validée** apparaît comme `inactive`. Il est facile de supposer l'inverse.
    `iaso/api/fhir/README.md` documente exactement la correspondance inverse et se trompe ; le code et
    ses tests s'accordent sur le tableau ci-dessus.

    Filtrer sur `?status=active` est donc la bonne façon de n'obtenir que les unités validées — ce que
    veut d'ailleurs la plupart des intégrations.

## Paramètres de recherche

Tous ces paramètres s'appliquent à `GET /api/fhir/Location/`.

| Paramètre | Type | Sémantique |
|---|---|---|
| `name` | string | correspondance **partielle**, insensible à la casse, sur le nom |
| `status` | token | `active` \| `inactive` \| `suspended`, selon la correspondance ci-dessus. Une valeur inconnue renvoie un `400` ordinaire, et non un `OperationOutcome` |
| `identifier` | token | correspondance **exacte** sur `source_ref`, ou `uuid`, ou l'un des alias |
| `type` | token | correspondance **exacte** et sensible à la casse sur le `short_name` du type d'unité (p. ex. `HF`, et non `Health Facility`) |
| `search` | string | correspondance partielle sur le nom ; convention DRF, équivalente ici à `name` |
| `_count` | number | taille de page. Défaut **20**, maximum **100** — au-delà, la valeur est silencieusement ramenée à 100 |
| `_skip` | number | décalage |

Les filtres se combinent en ET.

`identifier` est le paramètre à utiliser pour résoudre vos propres références externes en identifiants
IASO : il correspond exactement au `source_ref`, le champ qu'une intégration IASO renseigne
habituellement avec l'identifiant du système source. Passez la **valeur nue** — la syntaxe de jeton
FHIR `system|value` n'est pas analysée, et une requête comme
`?identifier=https://openiaso.com/org-unit/uuid|abc` ne correspond tout simplement à rien.

Il n'existe aucun filtre sur le parent, la version de source, la date ou le groupe, ni de `_sort`,
`_id`, `_lastUpdated`, `_include`, `_elements` ou `_summary`. Pour parcourir l'arbre, utilisez
`children`.

!!! warning "Les résultats couvrent toutes les versions de source visibles par votre compte"
    Il n'existe aucun moyen de restreindre une recherche FHIR à une source de données ou à une version
    de source. Si votre compte détient plusieurs pyramides, ou plusieurs versions de la même, elles
    apparaissent toutes dans le même jeu de résultats — et un même établissement réel peut légitimement
    y figurer plusieurs fois, sous la forme d'une `Location` distincte par version. L'extension
    `source-version` de chaque ressource est le seul moyen de les distinguer. Si cela vous importe,
    filtrez côté client sur cette extension, ou lisez les unités d'organisation via
    [`/api/orgunits/`](../modify_org_units_via_api/modify_org_units_via_api.md), qui accepte, lui, un
    paramètre `version`.

## Parcourir la hiérarchie

```
GET /api/fhir/Location/{id}/children/
```

Renvoie un Bundle des enfants **directs** uniquement — un seul niveau, pas tout le sous-arbre. Pour
parcourir une pyramide, procédez par récursion.

## Exemples en Python

En réutilisant le même `IasoClient` que dans le [guide d'écriture des unités
d'organisation](../modify_org_units_via_api/modify_org_units_via_api.md#un-petit-client-comme-socle) :

### Parcourir toutes les Locations page par page

Suivez le lien `next` plutôt que d'incrémenter `_skip` vous-même, et dédoublonnez au fil de l'eau : la
pagination n'étant pas triée de façon stable, une ressource peut légitimement apparaître sur deux pages
consécutives.

```python
def iter_locations(iaso, **params):
    """Produit chaque ressource Location une seule fois, en suivant les liens next du Bundle."""
    params.setdefault("_count", 100)          # 100 est le maximum côté serveur
    bundle = iaso.get("/api/fhir/Location/", params=params)
    seen = set()

    while True:
        for entry in bundle.get("entry", []):
            location = entry["resource"]
            if location["id"] in seen:        # pagination non triée : les doublons arrivent
                continue
            seen.add(location["id"])
            yield location

        next_link = next(
            (l["url"] for l in bundle.get("link", []) if l["relation"] == "next"),
            None,
        )
        if not next_link:
            return
        # next_link est une URL absolue ; on la redonne telle quelle à la session.
        bundle = iaso.session.get(next_link, timeout=60).json()


for location in iter_locations(iaso, status="active", type="HF"):
    print(location["id"], location["name"])
```

Le dédoublonnage vous protège de voir deux fois la même ressource, mais rien, au niveau de l'API, ne
vous protège d'en *manquer* une. Si l'exhaustivité est critique, comparez le nombre d'identifiants
uniques collectés au `total` du Bundle, et repliez-vous sur `/api/orgunits/` en cas d'écart.

### Résoudre une de vos références en identifiant IASO

```python
def find_by_source_ref(iaso, source_ref):
    bundle = iaso.get("/api/fhir/Location/", params={"identifier": source_ref})
    entries = bundle.get("entry", [])
    if not entries:
        return None
    return entries[0]["resource"]

location = find_by_source_ref(iaso, "HF001")
if location:
    print(location["id"], location["name"], location["status"])
```

### Parcourir l'arbre en profondeur

```python
def walk(iaso, root_id, depth=0):
    location = iaso.get(f"/api/fhir/Location/{root_id}/")
    print("  " * depth + f"{location['name']} ({location['status']})")

    bundle = iaso.get(f"/api/fhir/Location/{root_id}/children/", params={"_count": 100})
    for entry in bundle.get("entry", []):
        walk(iaso, entry["resource"]["id"], depth + 1)
```

Notez que cela déclenche une requête par nœud. Pour une pyramide entière, tout lister une seule fois
avec `iter_locations()` et reconstruire l'arbre en mémoire à partir de `partOf` revient bien moins
cher :

```python
def build_tree(iaso):
    children_by_parent = {}
    for location in iter_locations(iaso):
        part_of = location.get("partOf") or {}
        reference = part_of.get("reference")            # "Location/122", ou absent pour une racine
        parent_id = reference.split("/")[1] if reference else None
        children_by_parent.setdefault(parent_id, []).append(location)
    return children_by_parent                           # la clé None porte les racines
```

### Lire le véritable statut de validation IASO

```python
VALIDATION_STATUS = "https://openiaso.com/fhir/StructureDefinition/org-unit-validation-status"

def validation_status(location):
    for ext in location.get("extension", []):
        if ext["url"] == VALIDATION_STATUS:
            return ext["valueCode"]      # "NEW" | "VALID" | "REJECTED"
    return None
```

## Erreurs

Une location introuvable — ou hors périmètre — renvoie un `404` accompagné d'un `OperationOutcome`
FHIR :

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "not-found",
      "details": {"text": "Location with id '999' not found"}
    }
  ]
}
```

Les `401` et `403` sont des erreurs DRF classiques, et **non** des ressources `OperationOutcome` : ne
supposez donc pas que tout corps d'erreur porte un `resourceType`.

## Réserves de conformité

L'API est de forme FHIR R4 et déclare `fhirVersion: "4.0.1"` dans sa déclaration de conformité, mais
un client FHIR strict remarquera ce qui suit. Rien de bloquant si vous écrivez le client vous-même ;
tout cela compte si vous branchez un outil FHIR du commerce dessus.

- **Les éléments vides sont émis sous forme de `{}` ou `[]` plutôt qu'omis.** Une unité d'organisation
  sans coordonnées renvoie tout de même `"position": {}` ; une unité sans parent renvoie
  `"partOf": {}` ; de même pour `physicalType`, `managingOrganization`, `operationalStatus` et `type`.
  FHIR attend que les éléments absents soient omis, et un validateur rejettera `"position": {}` car
  `longitude` et `latitude` sont obligatoires dès lors que `position` est présent. **Testez la
  véracité de la valeur, pas la présence de la clé.**
- **N'envoyez pas `Accept: application/fhir+json` — vous obtiendrez un `406`.** Les points d'entrée
  sont servis par le rendu JSON ordinaire, qui n'annonce pas le type de média FHIR : la négociation de
  contenu échoue donc purement et simplement. Envoyez `Accept: application/json` (ou rien du tout).
  Les réponses reviennent en `Content-Type: application/json`.
- **Les systèmes de terminologie sont écrits en `https://`**, p. ex.
  `https://terminology.hl7.org/CodeSystem/location-physical-type`. Les URI canoniques de HL7 utilisent
  `http://`, et une URI de système est un identifiant opaque plutôt qu'une URL à déréférencer : ces
  codages ne correspondront donc **pas** à un serveur de terminologie standard ni à un validateur
  attendant la forme canonique. Il en va de même pour `meta.profile`, donné comme
  `https://hl7.org/fhir/StructureDefinition/Location`.
- **La déclaration de conformité est à `/api/fhir/Location/metadata/`**, et non à la racine du serveur
  `/metadata`, et elle **exige une authentification** — deux écarts à la norme : la découverte
  automatique de conformité échoue donc. Elle omet par ailleurs des éléments obligatoires en R4
  (`url`, `version`, `name`), et l'`OperationDefinition` qu'elle référence pour `children` n'est servie
  nulle part.
- **`meta.versionId` vaut toujours `"1"`** et il n'existe pas d'`_history` ; la ressource n'est pas
  versionnée. Faute de paramètre de recherche `_lastUpdated`, **il n'existe aucune synchronisation
  incrémentale** : vous relisez tout, à chaque fois.
- **Le `system` de l'identifiant de référence source incorpore le nom de la source de données** : ce
  n'est donc pas une URI opaque et stable, et elle peut contenir des espaces. Appuyez-vous sur
  `use == "official"` ou sur la valeur, jamais sur la chaîne du système.
- **`managingOrganization` porte un `display` mais aucune `reference`**, faute de point d'entrée
  `Organization` à référencer.
- **`operationalStatus` est enveloppé dans `{"coding": [...]}`**, alors que FHIR le type comme un
  simple `Coding`. Une date de fermeture l'emporte toujours sur une date d'ouverture, même si elle est
  dans le futur.
- **`fullUrl` contient un double slash** (`.../Location//123`).

Une remarque d'exploitation, qui n'est pas un problème de conformité : le compte de service avec lequel
vous vous authentifiez doit avoir un profil IASO rattaché. Un utilisateur qui n'en a pas — ce qui est
possible pour un super-utilisateur créé hors du flux normal — provoque un `500` plutôt qu'une erreur
propre.

## Aide-mémoire des pièges

- Le chemin de base est `/api/fhir/Location/`, et **non** `/fhir/Location/` comme l'affirme le README du module.
- `NEW` → `inactive` et `REJECTED` → `suspended`, et non l'inverse. Le README du module les intervertit.
- La pagination **n'est pas triée de façon stable** — dédoublonnez par `id` et comparez votre décompte au `total`.
- `Accept: application/fhir+json` est rejeté par un `406`. Demandez `application/json`.
- Les systèmes d'identifiants et de terminologie utilisent `https://`, et non le `http://` canonique de HL7.
- Les unités hors périmètre renvoient un `404`, pas un `403` — un `404` ne signifie pas que l'identifiant est libre.
- Les résultats couvrent toutes les versions de source visibles par votre compte ; aucun filtre de version n'existe.
- `type` correspond au **nom court** du type d'unité, pas à son nom d'affichage.
- `identifier` prend une valeur nue ; la syntaxe de jeton `system|value` ne correspond à rien.
- Un `status` invalide renvoie un `400` ordinaire, et non un `OperationOutcome`.
- `_count` plafonne à 100 et est silencieusement ramené ; la taille de page par défaut est 20.
- `children` ne renvoie que les enfants directs, un niveau à la fois.
- Les champs absents reviennent sous forme de `{}` / `[]`, et non omis — testez la véracité de la valeur.
- Lisez `status` pour la vue FHIR, et l'extension `org-unit-validation-status` pour le vrai statut IASO.
