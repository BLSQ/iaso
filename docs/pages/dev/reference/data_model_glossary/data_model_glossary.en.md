Some terminology in Iaso come from DHIS2, some from ODK which mean that it can be a bit confusing.
We will highlight some equivalences that might help you.

This is not (yet) the complete Data Model, but here are the main concepts/model in Iaso:

* Iaso is multi tenant. Tenant are called and represented by the model `Account`. It represents roughly one client org or country. It also represents the natural limit of right for a user.
* Each Django's User has a linked Iaso `Profile` that link it to an `Account` and store extra parameters for the user.
* Each tenant can have multiple `Project`. Projects are linked to one android version App via the `app_id`. We use the link to control what a user can see from that app.
* `DHIS2` is a standard server application and web UI in the industry to handle Health Data. Iaso can import and export data (forms and org unit) to it.
* `OrgUnit` (Organizational Unit) is a Node of the GeoRegistry tree. e.g a particular Country, City or Hospital. each belonging to each other via a `parent` relationship.
   * They can have a type `OrgUnitType` e.g. Country, City, Hospital
   * they can belong to multiple `Group`, e.g. Urban Region or Campaign 2017
   * DHIS2 has the concept of `Group` but not `Type` so when importing from a DHIS2 Instance all the type will be Unknown and OrgUnit will belong to group like `Clinic`
   * `GroupSet` are Group of group. Used when we export Group to DHIS2
  * OrgUnit may have a position in space, it can be an area, the  `geom` field is then used, or just a Point, the `location` field is then used.
    * It's technically possible to have both
    * a OrgUnit may have no geographical info
    * a OrgUnit may geographically be outside its parent.
* `DataSource` links OrgUnit and Group imported from the same source, e.g a DHIS2 instance, a CSV or a GeoPackage.
   * A `source_ref` on the imported instance is used to keep the reference from the original source, so we can match it again in the future (when updating the import or exporting it back)
   * `SourceVersion` is used to keep each version separated. e.g each time we import from DHIS2 we create a new version.
   * OrgUnit (for their parent) and Group should only reference other OrgUnit and Group in the same version. (This is not enforced everywhere yet)
* `Task` are asynchronous function that will be run by a background worker in production. eg: Importing Data from DHIS2. see Worker section below for more info.
* `Form` is the definition of a Form (list of question and their presentation).
    * The model contain the metadata, the actual definition is done in a `XSLForm` as an attached file.
    * Form are linked to one or more Project. This is used to know which Form are presented in the Mobile App.
    * Form can have multiple versions
* `Instance` or Form instance is the `Submission` of a form. A form that has actually been filed by a user.
    * Instance can be GeoTagged and/or linked to a OrgUnit
    * Note: We are moving to use Submission everywhere in the UI, but it is still in progress. please submit PR.
    * Submission cannot be done via the Iaso UI itself but through Enketo or the Mobile App.
* `APIImport` are used to log some request from the mobile app so we can replay them in case of error. See [vector_control wiki](https://github.com/BLSQ/iaso/wiki/Vector-Control)
* `audit.Modification` are used to keep a history of modification on some models (mainly orgunit). See [audit wiki](https://github.com/BLSQ/iaso/wiki/Audit)
* `Link` are used to match two OrgUnit (in different sources or not) that should be the same in the real world. Links have a confidence score indicating how much we trust that the two OrgUnit are actually the same.

They are usually generated via `AlgorithmRun`, or the matching is done in a Notebook and uploaded via the API.
  