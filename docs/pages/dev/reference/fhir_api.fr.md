# API FHIR - Unités d'organisation

IASO expose les unités d'organisation via une API conforme à [FHIR R4](https://build.fhir.org/location.html), en les associant à la ressource standard FHIR `Location`. Cela permet aux systèmes externes compatibles FHIR - plateformes d'échange d'information de santé, registres nationaux d'établissements, dossiers médicaux électroniques - de lire la structure organisationnelle d'IASO sans intégration sur mesure.

Cette API est **en lecture seule**.

## Authentification

Tous les endpoints nécessitent une authentification et la permission `iaso_org_units`.

## Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/fhir/Location/` | Liste des localisations (renvoie un `Bundle` FHIR) |
| GET | `/fhir/Location/{id}/` | Récupère une localisation spécifique |
| GET | `/fhir/Location/{id}/children/` | Récupère les localisations enfants d'une localisation |
| GET | `/fhir/Location/metadata/` | `CapabilityStatement` FHIR décrivant cette API |

## Correspondance des champs

| Unité d'organisation IASO | Champ FHIR Location |
|---|---|
| `id` | `id` |
| `name` | `name` |
| `validation_status` (NEW / VALID / REJECTED) | `status` (suspended / active / inactive) |
| `source_ref`, `uuid`, `aliases` | `identifier` |
| `org_unit_type` | `type` |
| `org_unit_type.category` | `physicalType` |
| `location` (GPS) | `position` |
| `parent` | `partOf` |
| `version.data_source` | `managingOrganization` |

Les données propres à IASO qui n'ont pas de champ FHIR natif - statut de validation, profondeur du type d'unité d'organisation, version de la source, dates d'ouverture/fermeture - sont transportées sous forme d'extensions personnalisées, dans l'espace de noms `http://openiaso.com/fhir/StructureDefinition/...`.

## Recherche

| Paramètre | Description | Exemple |
|---|---|---|
| `name` | Recherche par nom, insensible à la casse | `?name=hospital` |
| `status` | `active`, `suspended`, ou `inactive` | `?status=active` |
| `identifier` | Correspond à source_ref, uuid, ou alias | `?identifier=HF001` |
| `type` | Type d'unité d'organisation | `?type=HF` |
| `_count` | Taille de page (maximum 100) | `?_count=50` |
| `_skip` | Décalage pour la pagination | `?_skip=20` |

## Exemple

```http
GET /fhir/Location/?name=hospital&status=active&_count=25
```

Renvoie un `Bundle` FHIR contenant les ressources `Location` correspondantes - voir les spécifications [FHIR Location](https://build.fhir.org/location.html) et [FHIR Search](https://build.fhir.org/search.html) pour le détail complet du format des ressources et des requêtes.

## Erreurs

Les erreurs suivent le format `OperationOutcome` de FHIR plutôt que le format d'erreur habituel de l'API IASO.
