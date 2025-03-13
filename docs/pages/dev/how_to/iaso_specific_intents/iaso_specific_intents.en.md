# IASO specific intents

In [ODK Forms](../../../users/reference/iaso_concepts/iaso_concepts.en.md#questionnaires-or-xls-data-collection-forms), 
it is possible to launch external apps/tools to populate questions.
IASO has a few built-in tools you can use in order to retrieve IASO related information.

## Application specific actions

Because two or more IASO variant applications can be installed at the same time on the same device, IASO uses an application
specific prefix for its actions. Here is the list of prefixes per application.

| Prefix                  | Application                   |
|-------------------------|-------------------------------|
| iaso                    | IASO (demo)                   |
| canevas                 | CIV Vignette                  |
| canevas                 | Canevas Annuel                |
| malifbr                 | FBR - Santé au Mali           |
| iaso                    | Registre Santé                |
| coda2                   | CODA2 (SSD)                   |
| coda2nigeria            | CODA2 (Nigeria)               |
| fboburundi              | FBP Burundi                   |
| ihpssc                  | Sites de soins communautaires |
| nigerpbf                | Fonds d'achat Niger           |
| ugandarbf               | Uganda RBF                    |
| fbpciv                  | FBP Côte d'Ivoire             |
| camerooncollect         | Cameroon Collect              |
| nigerhfr                | Carte Sanitaire Niger         |
| cameroonrbf             | PBF Cameroun                  |
| trypelim                | Trypelim                      | 
| projectpathways.collect | Pathways                      | 


## Pick an OrgUnit

It is fairly common for ODK forms within IASO to want to select an OrgUnit. 
You need to use the following action in `body::intent`:
`<prefix>.action.pick_ou(<options>)`

The following options are available:
- `map=''`: How to map the returned value to a question. Possible returned values are:
  - id
  - name 
  - parentId 
  - accuracy 
  - latitude 
  - longitude 
  - orgUnitTypeId 
  - path
- `limit_root='true'`: Whether you want to limit to the user's given root (optional, default: `false`))
- `ou_type='Entity Type name'`: The Entity Type name you want to select (optional)
- `filter_out_ou_types='Entity Type1,EntityType2'`: The Entity Types you want to hide from the list (optional) 
- `allow_ou_creation='true'`: Whether you want to allow creating a new OrgUnit while picking one (optional, default: `false`)
- `disable_ou_creation_location='true'`: Whether you want to disable taking the location when creating an OrgUnit. Applies only if not in registry mode (optional, default: `false`)

### Example

| type        | name             | label                                | appearance | body::intent                                                                          |
|-------------|------------------|--------------------------------------|------------|---------------------------------------------------------------------------------------|
| begin_group | facility_sc      | SC                                   | field-list | iaso.action.pick_ou(map='id:facility_sc_id;name:facility_sc_name',ou_type='Hospital') |
| note        | facility_sc_note | Press "Start" to choose the facility |            |                                                                                       |		
| text        | facility_sc_name | Name of the SC:                      |            |                                                                                       |	
| text        | facility_sc_id   | SC identifier                        |            |                                                                                       |
| end group   |                  |                                      |            |                                                                                       |


## Pick an Entity

The best way to link entities between them at the moment is to pick an entity in a form and keep a link to its ID.
`<prefix>.action.pick_entity(<options>)`

The following options are available:
- `map=''`: How to map the returned value to a question. Possible returned values are:
  - id
  - name
  - entityTypeId
  - EntityTypeName
- `entity_type='Entity Type name'`: The Entity Type name you want to select (optional)
- `org_unit_id='OU_ID'`: The OrgUnit ID you want to limit your selection to (optional)

### Example

| type        | name         | label                              | appearance | body::intent                                                                                                      |
|-------------|--------------|------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------|
| begin_group | entity_group | Entity                             | field-list | iaso.action.pick_entity(map='id:entity_id;name:entity_name',org_unit_id='${current_ou_id}', entity_type='Mother') |
| note        | entity_note  | Press "Start" to choose the mother |            |                                                                                                                   |		
| text        | entity_name  | Name:                              |            |                                                                                                                   |	
| text        | entity_id    | Entity identifier                  |            |                                                                                                                   |
| end group   |              |                                    |            |                                                                                                                   |
