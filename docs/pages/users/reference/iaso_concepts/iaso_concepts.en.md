# Concepts

## Questionnaires or XLS data collection forms

What comes with data collection are questions, and to organize these questions, **data collection forms**. These are basically lists of the questions one would like to collect answers for, while specifying options (mandatory or not, skip a question depending on previous answer, etc.).
IASO builds on [XLS forms](https://xlsform.org/en/) for its questionnaires, which are therefore pre-defined using an Excel file.

In IASO, data collection forms are **versioned** meaning that every time a new version is created, the former version is kept and available in the system. 

## Organization Units
IASO uses the notion of **Organization Units (Org unit or OU)** to manage geographic data. 
The **organisation unit types (OUT)** represent levels in the hierarchy

Example:

- Country

- Region
- District
- Area
- Facility/Village/Point of Interest

The organization units are classified in the pyramid according to a parent and one or several children (except the top parent(s) and the lowest child/children). 
Example below:

- Democratic Republic of Congo (Org unit type "Country") is the parent org unit of

- Kinshasa (Org unit type "City"), which is the parent org unit of 
- Bluesquare office (Org unit type "Office")


Data collection in IASO is structured according to the defined hierarchy, and any user needs to explicitly select an organization unit before proceeding to opening the questionnaire and answer questions. This way, one makes sure that the data collected is correctly associated with the relevant geography. 

## Projects
In IASO, a Project is a mobile application instance, with its own App ID. Within one account, you can have one or several Project(s) with different feature option(s). 
Users can be linked to one or several Project(s). 

Good to know:

- One Project is linked one data source

- One Project  can be linked to one or several users
- Some users can be limited to one or several Project(s)/App ID(s) - you can define this in the User management part
- Every Org Unit Type has to be linked to one or several Project(s)
- Every Form has to be linked to one or several Project(s)

## Entities
In IASO, an “**Entity**” is anything that can move or be moved and that we want to track through time and Org Units. For example, an person, a car, a parcel, etc.

To differentiate between different kinds of entities, IASO has a concept of “**Entity Type**”.

An entity is represented by a submission to a [form](#Questionnaires-or-XLS-data-collection-forms). This submission is referred to as the **profile**.
The entity type defines which form has to be filled in to create a new entity.

### Workflows
Based on the entity's profile, it is possible to offer different kind of forms to fill and how each new submission impacts the profile.
The rules which define which forms and how each submission impacts the profile are called a "**Workflow**." 
