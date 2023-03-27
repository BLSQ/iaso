# Iaso User guide

## Table of Content

**[Table of Content](#table-of-content) 2**

**[Web interface](#web-interface) 5**

> [Quick overview of buttons](#quick-overview-of-buttons) 5
>
> [Forms](#forms) 7
>
> [List](#list) 7
>
> [Submissions](#submissions) 10
>
> [Form statistics](#form-statistics) 16
>
> [DHIS2 mappings](#dhis2-mappings) 16
>
> [Completeness](#completeness) 18
>
> [Organisation Unit](#organisation-unit) 19
>
> [List](#list-1) 20
>
> [Group](#group) 23
>
> [Organisation unit type](#organisation-unit-type) 24
>
> [Data Source](#data-source) 25
>
> [List](#list-2) 25
>
> [Matching](#matching) 25
>
> [Planning](#planning) 26
>
> [List](#list-3) 27
>
> [Admin](#admin) 32
>
> [Tasks](#tasks) 32
>
> [Projects](#projects) 32
>
> [Users](#users) 32
>
> [Teams](#user-permissions) 34
>
> [Logout](#logout) 36

**[Iaso App](#iaso-app) 38**

> [Quick overview of buttons](#quick-overview-of-buttons-1) 38
>
> [Homepage](#homepage) 40
>
> [List of forms](#list-of-forms) 40
>
> [Settings](#settings) 41
>
> [Refresh data](#refresh-data) 42
>
> [Logout](#logout-1) 44
>
> [About](#about) 44
>
> [Start](#start) 44
>
> [Units Tab](#units-tab) 44
>
> [Data collection](#data-collection) 45
>
> [How to interrupt data collection?](#how-to-interrupt-data-collection)
> 49
>
> [Forms Tab](#forms-tab) 53
>
> [Upload](#upload) 53
>
> [Finalise forms](#finalise-forms) 53
>
> [Send data](#send-data) 53
>
> [Micro-planning](#micro-planning) 54
>
> [Edit and view](#edit-and-view) 55
>
> [View Sent Forms](#view-sent-forms) 55
>
> [Edit a saved form](#edit-a-saved-form) 56
>
> [Edit a finalised form](#edit-a-finalised-form) 56
>
> [Review a Form](#review-a-form) 56
>
> [New Version 1.28](#new-version-1.28) 56

Iaso is a geospatial data management platform (a georegistry) developed
by Bluesquare to support the continuous management of geographical
information.

The tool supports data management based on master lists of generic
geographical objects often called organizational units (“org. units”,
which are for example health areas, schools, provinces, health
districts, or wells).

Iaso prevents data fragmentation and lack of standardisation that can
lead to duplicative efforts, imprecise metrics, time consuming data
integration efforts and errors.

Iaso as georegistry is used in several countries in support of a process
where updated data improves the health information system based on
DHIS2.

Iaso provides a number of core features in support of continuous
geospatial data management: a **mobile application**, a **web
dashboard**, a **matching featur**e to merge various data sources, a
**data scienc**e and **scripting** interface and a seamless
bi-directional **integration** with DHIS2.

**Capabilities in more details/ 3 main functionalities :**

-   Data collection (trough forms)

    -   Create forms

    -   Validation of data collection

    -   View forms sent from the Open Data Kit (ODK) mobile app

    -   Export results ( CSV/Geopackage) into a data warehouse, such as
        > DHIS2

-   Data management (trough territorial hierarchies)

    -   Location of structures using GPS

    -   Mapping of multiple data sources

    -   Distribution of validation work by geographic sub-area

    -   Traceability of changes

-   Micro planning

-   Possibility of adding matching approaches available to end users

# Web interface

To log into the web interface, go to
[<u>https://iaso.bluesquare.org/login/</u>](https://iaso.bluesquare.org/login/)
and sign in with the username and password.

<img src="./media/image78.png"
style="width:2.34896in;height:2.59779in" />

Once in the interface, you will see the Menu button in the top left of
the screen:

<img src="./media/image49.png"
style="width:0.61979in;height:0.57284in" />

The menu allows you to navigate to the different windows for managing:

-   Forms

-   Org. units

-   Planning

-   Admin

In this manual, we’ll first start with an overview of buttons and then
move to the different functionalities by following the order of the
menu.

## Quick overview of buttons

|Button                                                                       | Description
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| <img src="./media/image39.png" style="width:0.5625in;height:0.41667in" />   | Allows to show the main menu for the app                                          |
| <img src="./media/image67.png" style="width:0.46875in;height:0.32292in" />  | This is the view icon to show more details about the selected element             |
| <img src="./media/image26.png" style="width:0.5in;height:0.41667in" />      | The pencil icon allows to edit or modify an element                               |
| <img src="./media/image53.png" style="width:0.46875in;height:0.34375in" />  | DHIS mapping allows to map questions with DHIS2 dataElements                      |
| <img src="./media/image86.png" style="width:0.53125in;height:0.41667in" />  | This icon allow to hide the menu bar                                              |
| <img src="./media/image89.png" style="width:0.47554in;height:0.39063in" /><img src="./media/image109.png" style="width:0.43791in;height:0.36979in" />| This buttons allow to scroll-up the content of a table |
| <img src="./media/image82.png" style="width:1.21354in;height:0.46476in" />  | This button allows to create a new element in the platform                        |
| <img src="./media/image24.png" style="width:1.11979in;height:0.4552in" />   | This button allows to download forms to CSV format                                |
| <img src="./media/image101.png" style="width:1.02604in;height:0.44492in" /> | Download forms to XLSX format                                                     |
| <img src="./media/image41.png" style="width:1.10156in;height:0.39063in" />  | This button allows searching for an element by many criteria                      |
| <img src="./media/image103.png" style="width:1.31771in;height:0.43027in" /> | Allows to refresh data                                                            |
| <img src="./media/image4.png" style="width:0.4375in;height:0.40625in" />    | Allows to add a tabpanel for searching a element                                  |
| <img src="./media/image54.png" style="width:1.76654in;height:0.48438in" />  | Allows to define that a question name will not map with a dataElement             |
| <img src="./media/image105.png" style="width:1.10938in;height:0.46554in" /> | Validate the mapping between a selected form question with a data element Dhis2   |
| <img src="./media/image31.png" style="width:3.10417in;height:0.375in" />    | These buttons allow to filter forms sent by status (ready, with error or Exported)|

## Forms

Forms (in the context of data collection surveys) are used to collect
information from a targeted group of people. Forms are written
questionnaires that will be filled by field agents when they are
face-to-face with the person, household, health centre of interest.

This view allows you to create and view forms then map to DHIS2 and get
data entry completeness.

<img src="./media/image96.png" style="width:6.5in;height:3.09722in" />

### List

The "list" view contains the list of forms available in Iaso. It allows
you to search, view, modify or create forms.

-   Search:

<img src="./media/image97.png" style="width:6.5in;height:2.11111in" />

The textbox “search” allows you to search on the name of the form or the
form ID using the command line "ids:" followed by the form IDs separated
by commas. This allows multiple questionnaires to be searched at once.

Example: ids: 17727, 16768, 19999, 14444

-   Click on View button to view the form :

<img src="./media/image47.png" style="width:6.5in;height:0.73611in" />

In the Form view you can see details of

· When the form has been updated

· What Organisation Unit

· For what period

· Download the file in XML

· When the form was created

-   To modify click on the edition button of the form

<img src="./media/image113.png" style="width:6.5in;height:1in" />

An edition window opens where you can modify the form informations

-   Name

-   XLSForm

-   Periodicity : Frequency of encoding the form. Ex: 'Monthly' when
    > there is a form to fill in every month. This is an optional field
    > that should not be filled if the form is a “one shot” event.
    > However, if you plan to re-use the form the following year, you
    > could indicate 'Annual'.

-   Number of periods before and after : defines in the mobile
    > application how many months in the past or future it is possible
    > to enter the form. Ex: If you note 2 forward and 2 backward, it
    > will be possible today (August 1) to fill the form for the periods
    > from June to October.

-   Whether only one answer is possible or more

-   Project

-   Type of organisation unit

-   Name of field in “device” : Allows you to filter by the unique
    > identifier assigned to each smartphone (IMEI number) that has
    > submitted a form.

-   Name of “location” field : Allows to filter on GPS positions
    > (provided through the form submission but also automatically).

-   Synchronise with another form

<img src="./media/image107.png"
style="width:6.17188in;height:3.43212in" />

-   To add a new form, click on the “**create**”
    > button<img src="./media/image30.png" style="width:6.5in;height:0.76389in" />

A window will open allowing you to enter the information required to
create a new form.

-   Form name

-   XLSForm

-   Periodicity

-   Number of periods before and after

-   If only one answer is possible or more

-   Project

-   Type of organisational unit

-   Name of the “device” field

-   Name of the “location” field

> And you can choose whether or not to save the changes made.

-   Archive

Whenever a form is deleted, it is sent to the Archives. This allows
tracking of deletion and restoring forms that were deleted by mistake.

To restore a form click on the restore button.

<img src="./media/image58.png" style="width:6.5in;height:2.65278in" />

**Download**

-   To download the **list of forms**, you can click on the CSV and XLSX
    > buttons. You will find the different forms, the groups they are
    > assigned to, the creation and modification dates...

<img src="./media/image59.png" style="width:6.5in;height:1.27778in" />

-   To download a **specific form**, click on the XLS or XML links on
    > the form line. This option allows you to see the different
    > questions, options and details of the form.

<img src="./media/image12.png" style="width:6.5in;height:1.27778in" />

You can search the results with the filters provided, and export results
in CSV or XLSX.

### Submissions

Submissions are forms that have been submitted by the field agents
(usually through the mobile app).

This view allows you to search forms through free text entry and several
filters that can be combined.

<img src="./media/image42.png"
style="width:6.31771in;height:2.96649in" />

The "verify" button allows you to select all, unselect all, export the
selection to DHIS2, compare submissions (Ex : remove duplicates, compare
2 hospitals in the same region..) or delete the selection. If you hover
the mouse over the verify button, the options appear.

**Visualise a submission**

You can view a specific submission/submitted form by clicking on the
"View" button.

<img src="./media/image63.png" style="width:6.5in;height:0.47222in" />

This allows you to see the data submitted and edit it on Enketo
([open-source](https://github.com/enketo/enketo-express/) web
application that uses a popular [open-source form
format](https://getodk.github.io/xforms-spec/)).

<img src="./media/image72.png" style="width:6.5in;height:2.5in" />

The “Information” section provides a technical overview of the form.

The “Location” section shows the health pyramid's indication of where
the data was collected.

The “Export Requests” section shows when the data was exported to DHIS2,
by whom, and any errors that occurred during export.

The “Files” section can contain images, videos, documents.

The “Form” section shows all form questions and answers entered during
data collection.

The icons at the top right (after clicking on the pencil) allow you to:

-   Correct a form submission: click on the Enketo icon

-   Export the submission

-   Modify the time period and/or the organisational unit

-   Delete the form submission

**Edit a submission**

To edit a form, click the Enketo button <img src="./media/image18.png"
style="width:0.27032in;height:0.3334in" /> to open the edit page.

Edit the form by changing the answers to the questions that need to be
changed. Click on submit at the bottom of the form
<img src="./media/image7.png"
style="width:1.04311in;height:0.32269in" /><img src="./media/image18.png"
style="width:0.31771in;height:0.42361in" /><img src="./media/image57.png"
style="width:6.15663in;height:3.40104in" />

**Export a submission**

The export function allows you to export the form to DHIS2.

**Modify the period or the organisation unit**
<img src="./media/image18.png"
style="width:0.32292in;height:0.41979in" />

When you click on “Edit Period and/or Organisational Unit”, a window
opens allowing you to reassign the instance. You can change the time
period or organisational unit that has been assigned to the submitted
form.

<img src="./media/image76.png"
style="width:1.56771in;height:1.65794in" />

**Delete a submission**

Allows you to delete the form. If it has already been exported to DHIS2,
this will not delete the data in DHIS2. A warning message will appear:

<img src="./media/image66.png"
style="width:4.52131in;height:1.05729in" />

If this was done by mistake, you can restore the form via the
[<u>Archives</u>](#kix.gvzp3gqzxu9n) page.

**Download a submission**

The "XML" icon allows you to download a submission in XML format.

<img src="./media/image102.png"
style="width:5.96354in;height:2.29367in" />

<img src="./media/image71.png"
style="width:5.95313in;height:2.73806in" />

### Form statistics

This view allows you to see statistics about the forms. When clicking on
”Form Statistics" you will open a page with two graphs.

The first one shows the total number of submissions over time and the
second one shows the new submissions per month per form.

<img src="./media/image74.png" style="width:6.5in;height:1.75in" />

### DHIS2 mappings

A great advantage of Iaso is that you can export data to DHIS2. When
doing so, prior mapping is necessary. After the form is uploaded, map
the form to match the data item in DHIS2. To match, use match with
DHIS2.

Click on DHIS mappings to see the forms :

<img src="./media/image75.png" style="width:6.5in;height:2.59722in" />

In the Form view you can see details of:

-   Actions

-   Name of forms available for mapping

-   Versions

-   Type of the form :

    -   Aggregate : fix

    -   Event : series of singular events

    -   Event Tracker : continuous

-   Number of questionnaire to be mapped

-   Total number of questionnaires

-   Mapping coverage

-   Date of last modification

Click on action to take of a form and a window will open allowing you to
map each questionnaire of the xls forms to the correspondent DHIS2 data
element<img src="./media/image93.png"
style="width:2.03704in;height:1.83333in" /><img src="./media/image98.png"
style="width:2.05729in;height:1.8085in" />

The mapping process consists of selecting a question on the left and
deciding whether it should be mapped to DHIS2 or not.

Some questions may not need to be mapped like notes, metadata etc. in
such a case click on never map.

If the question is to be mapped, search for the correspondence DE in the
box by using the name, code or ID and then confirm.

Once confirmed, the question will turn to green and be counted.

<img src="./media/image115.png"
style="width:7.03646in;height:3.20249in" />

### Completeness

In the view “completeness” you will see details of :

-   Buttons to select forms “ready” to be exported, form with “errors”
    > and forms that have been “exported”

-   Periodicity filter : the periodicity filter allows you to organise
    > the data into months, quarters, semesters or years. The list will
    > display the forms available for the selected period, and will
    > indicate how many forms have been submitted for each

-   Synchronise button to synchronise two forms

Click on each of these buttons to have forms ready to be exported,
errors and exported. A periodicity filter is there to organise data in
months, quarters, semester or yearly.

<img src="./media/image94.png"
style="width:6.96429in;height:1.48438in" />

If you click on the number of submissions, you will be taken to the
submissions view, where you can click on the view icon and see the
submissions for that form.

Click on the <img src="./media/image104.png"
style="width:0.49791in;height:0.40738in" />button to synchronise two
forms

Eg: to get aggregate data from community verification survey, all the
client forms should be synchronised to a single form.
<img src="./media/image17.png" style="width:6.5in;height:2.95833in" />


## Organisation Unit

The location of the data, the geographical context, is represented as
organisational units. Organisational units can be either a health
facility or department/sub-unit providing services or an administrative
unit representing a geographical area (e.g. a health district).

Organisation units are located within a hierarchy, also referred to as a
tree. The hierarchy will reflect the health administrative structure and
its levels. Typical levels in such a hierarchy are the national,
province, district and facility levels.

Example of an Org Unit : Kerala Child Hospital, Benue district,..

### List

This view allows you to search the Organisation Unit pyramid (in order
to find an org unit) through free text entry and several filters that
can be combined.

<img src="./media/image111.png"
style="width:7.4465in;height:2.05729in" />

The search results can be exported in CSV, XLSX or GPKG.

<img src="./media/image29.png" style="width:3.625in;height:0.5625in" />

Results can be seen in a list or on a map

<img src="./media/image35.png"
style="width:6.18229in;height:2.9029in" />

The status for when a village has just been added and needs to be
reviewed for example.

The external reference is used to export data to DHIS2.

The map helps you to know where the structure is located.

You can see the history of modifications by clicking on the little clock
icon or the details of the filled forms by clicking on the eye icon.

<img src="./media/image32.png" style="width:6.5in;height:2.875in" />

Several searches can be made by adding tabs to the page with the +
button. <img src="./media/image45.png" style="width:7.01017in;height:1.93229in" />

You can choose the colour of the results on the map for each search.

<img src="./media/image90.png"
style="width:6.95313in;height:2.9466in" />

## <img src="./media/image120.png" style="width:6.26042in;height:2.38542in" />

**Creation** of an organisational unit in the platform

Allows you to create an organisational unit at any level. We can
therefore add a municipality, a province, etc. (Reserved for System
Administrator only).

<img src="./media/image16.png" style="width:6.86961in;height:2.80729in" />

Advantage:

-   Easier than creating via tablet for the administrator

-   Allows you to create an organisational unit at any level and
    > directly validate it

-   Allows before creation to verify that this unit does not already
    > exist elsewhere and therefore to move it rather than create it.

### Group

Organisation units can be grouped in organisation unit groups, and these
groups can be further organised into group sets. Together they can mimic
an alternative organisational hierarchy which can be used when creating
reports and other data output. In addition to representing alternative
geographical locations not part of the main hierarchy, these groups are
useful for assigning classification schemes to health facilities, e.g.
based on the type or ownership of the facilities. Example:

<img src="./media/image44.png" style="width:6.5in;height:2.41667in" />

<img src="./media/image5.png" style="width:6.5in;height:2.29167in" />

This view allows you to search the Organisation Unit Groups through free
text entry. Groups can be edited by clicking on the pencil icon
<img src="./media/image37.png"
style="width:0.57292in;height:0.5625in" />or deleted by clicking on the
delete button <img src="./media/image20.png" style="width:0.58333in;height:0.52083in" />or a new group can be created
by clicking on the create button
<img src="./media/image1.png" style="width:1.29167in;height:0.4375in" />.

When you click on “Org Units” , you will see the list of that Org Unit
group.

### Organisation unit type

This is specific to Iaso and not exported to DHIS2.

Example DRC Health Pyramid:

-   Country (level 0) = Org Unit Type

-   Province (level 1) = Org Unit Type

-   Health zone (level 2) = Org Unit Type

-   Air de santé (level 3) = Org Unit Type

-   Health Centre (level 4), Hospital (level 4), School (level 4),
    > Village (level 4), Individual (level 4) = Org Unit Type

<img src="./media/image84.png" style="width:6.5in;height:2.38889in" />

### Data Source

The data source is the place where the data comes from.

#### List 

Data sources with their names, versions, descriptions. It is possible to
edit the data source, check up on the files’ version history or compare
data sources and export them to DHIS2.

<img src="./media/image52.png" style="width:6.5in;height:1.86111in" />

#### Matching

1.  List

<img src="./media/image51.png" style="width:6.5in;height:1.48611in" />

This part is for the "management of the pyramid".

This is rather a "geospatial" functionality : to have several pyramid
sources and try to make links (Example: where in a csv “province x” is
called "PROVINCE X" and in another source it is called "DPS X").

1.  Algorithms runs

The algorithms run part is intended for data science work.

<img src="./media/image40.png" style="width:6.5in;height:1.26389in" />

## Planning

The micro planning feature makes it possible to plan for field work
(census, surveys, etc.) It can be found in the main menu panel.

<img src="./media/image9.png" style="width:6.5in;height:3.09722in" />

Before jumping straight to the “Planning” feature, some steps are
required. You need to create a project, forms, users and teams
beforehand.

To create new user.s, see [here](#users). However, during the
User creation process, in the “Location” tab, it might be a good idea to
restrict each user to the org unit s.he is/will be assigned to.
Optionally, you can also edit the user afterward, once the org unit has
been assigned.

To create teams, see [here](#user-permissions).

### List 

Under "List" you will see the list of schedules/plannings that have been
created in Iaso. This is also the place where you can proceed to create
a schedule or planning.

Click on “Planning” in the menu panel and on the
<img src="./media/image1.png" style="width:1.29167in;height:0.4375in" />
icon.

<img src="./media/image48.png" style="width:6.5in;height:3.80556in" />

The “Project” field will define in which mobile app environment the info
will be visible. The “Teams” is the team responsible for the planning.
The “Forms” field defines which form they will have to complete.

Once you have completed the fields, click Save to finish. Click on the
<img src="./media/image37.png" style="width:0.57292in;height:0.5625in" /> button from the Planning list
to edit your new planning. The “Publishing status” (in the lower left
corner ) feature makes it possible to ensure, once completed (and all
assignments made), the newly created planning will be available in the
Iaso mobile app for the relevant project.

In order to assign areas to the teams, click on
<img src="./media/image67.png" style="width:0.46875in;height:0.32292in" />. This gives you the list of
teams in your project along with the map of the project area. You can do
the assignment either through the “Map” tab or the “List” tab. If
processing through the map, first activate the “Parent picking mode” to
help you select the level at which you want to work. Next, select the
relevant team and then the areas on the map by clicking on them.

In other words, the field “Base organisation unit type” permits you to
define the level (within the pyramid) at which you distribute the work.
The “Parent organisation unit type” field helps you in that work by
letting you select a whole district at once (without having to click on
every area separately and manually).

<img src="./media/image10.png" style="width:2.97396in;height:2.55034in" />
<img src="./media/image25.png" style="width:2.9343in;height:2.41146in" />

Selected areas will be highlighted with the team’s colour.

<img src="./media/image95.png" style="width:1.36979in;height:1.78073in" />

You can change the colours of each team by simply clicking on the colour
in front of the team and choosing the one you prefer.

<img src="./media/image19.png" style="width:4.04688in;height:2.90469in" />

If you prefer using the List tab, the process is pretty similar. The
main difference being that you work here with a list of names, according
to the selected level. Org units are assigned by clicking in front of
the item name, in the “Assignment” column.

<img src="./media/image73.png" style="width:6.5in;height:2.68056in" />

You can sort Org units and Parents by clicking on the column name.

It is also possible to go to a lower level (user / team member) to
assign org units to each team member, using the same process (through
list or map). Select the team in the dropdown list and choose the
relevant org unit level (must be lower than the team level) then click
on <img src="./media/image106.png" style="width:1.15625in;height:0.51042in" /> to apply the filter. You can
now assign org units in a similar way as you did for teams.

<img src="./media/image11.png" style="width:5.94271in;height:2.63803in" />

Assignments are not limited to org units in the form of areas. It is
possible to assign interest points/facilities (places such as health
centres, schools, churches etc.) to teams or users. Like other types of
org units, it can be managed through the “Map” or the “List” tabs

Example below presents the steps to schedule a campaign using the
micro-planning functionality:

Step 1: Create the project

Step 2: Create teams

Step 3: Specify the expected start date and end date of the campaign

Step 4: Create and assign a form to the schedule

Step 5: Specify areas / part of the country/ org units involved in the
census

Step 6: Assign teams to their org units

The screenshot below allows you to see the work content of the different
teams per colour.

<img src="./media/image61.png" style="width:5.68229in;height:3.08701in" />

## Admin

### Tasks

This is the Iaso operations log that is usually used by admins to
trace/debug errors.

An operation log contains information about when and where an operation
ran, the operation status, the number of source and target records
processed, and any log messages.

### Projects

The basis of Iaso. Usually the first thing that will be created in Iaso.

### Users

Users are the people using Iaso (web and/or mobile version). A user has
a user account (login and password).

This view allows you to manage users and their access. You can search
for a user through a free text entry.

In the view you can see details of:

-   Users names

-   First name

-   Last name

-   Email address

-   Action(s)

<img src="./media/image6.png" style="width:6.5in;height:2.77778in" />

Click on edit under actions(s) to update user roles

Click on **+CREATE** to add a new user. Fill in the details and define
permission levels. For example, you can limit access by region.

<img src="./media/image50.png" style="width:2.00006in;height:2.61979in" /><img src="./media/image69.png" style="width:2.22917in;height:2.65104in" /><img src="./media/image114.png" style="width:2.05037in;height:2.64063in" />

You can modify info and permissions for a user by clicking on the pencil
icon <img src="./media/image37.png" style="width:0.37044in;height:0.37044in" />.

You can change the app language by clicking on the language version
menu.

###  User Permissions

-   Data completeness

> This allows to see the number of forms filled in in a specific area.
> In real time

-   Statistic data completeness  
    > Completeness per org unit% gens remplis entierement le formulaire
    > terminé formulaire

-   submissions

> This feature allows app users to fill in a form and submit it

-   Update submissions  
    > Allow user to updates the submissions

-   Forms

> This role enables you to create a new form

-   Mapping with DHIS2

> To map data element from DHIS2 with data element in Iaso. Access to
> the datasource

-   Organisation units

> To manage the health pyramid behind the project ( edit, add, delete
> health facilities, health zone) and access to the organizat!ion unit
> menu

-   Pages

> This allows to add links with external pages such as dashboards (Power
> BI)

-   Projects

> This allows the user to create a new project, (one app per project) →
> to check

-   Sources

> WHen you have different pyramids, and data source ex: project data and
> pyramid SNIS. Allow users to change the source version.

-   Sources matching

> ?

-   Tasks

> This permission allows you to create new tasks to a user in bulk and
> to access to the background tasks.

-   Teams

> Create/update teams with specific rights according to the permission,
> project or geographical area. Access to teams.

-   Update submissions

> Rights to change values in a form submission on the web interface

-   Users

> This allows you to see all users, change their permissions and their
> allowed geographies, create a new user or an administrator

-   Links  
    > Access to algorithms runs in orgunit/datasource

-   Report  
    > Access to report API what is it?

-   Planning  
    > Access to the planning ( just access to rights to change/ create
    > it?)

-   Assignments  
    > Access to planning assignment, what is it?

-   Entities  
    > Access to entities but what’s an entity?

-   Storages  
    > Access to storages what’s a storage?

-   Workflows  
    > Access to workflows, what’s a workflow?

-   Polio_budget-admin  
    > Make user admin of budgets

-   Iaso Polio  
    > Access to polio plug in

The api is very restrictive, the csv file format must follow the exact
example as shown above. Org units accept full names or ids. ID is
preferred as there can be multiple org units with the same name.

User type (example of RDC)

-   System administrator

Tasks: Set up the basic structure (metadata) of the system.  
Recommended authorities: Add, update and delete the core elements of the
system, for example data elements, indicators and data sets, plan
campaigns, create micro planning, Data completeness stat, Mapping with
DHIS2, Organisation units, Pages, Projects, Sources, Sources matching,
Tasks, Teams, Update submissions, Users, Create a new user (later pay
user)  
see all results of people below, edit results, change forms, Only system
administrators should modify metadata.

-   National health managers/Province/Zone health managers

Tasks: Monitor and analyse data  
Recommended authorities: Access to the reports module, the GIS, Data
Quality apps and the dashboard, plan campaigns, create new users, update
submissions, validate submissions, create teams, see Data completeness
dashboard, Form submissions, Forms, Mapping with DHIS2, Organisation
units, Pages, Projects, Sources, Sources matching, Tasks, Teams, Users,
→ only for specific area/ provinces/HZ.  
Don't need access to enter data, modify data elements or data sets.

-   National/District/Facility health information system division
    > officer

Tasks: Enter data that comes from facilities which are not able to do so
directly, Monitor, evaluate and analyse data  
Recommended authorities: Access to all the analysis and validation apps,
Access to the Data Entry app. Data completeness, Form submissions,
O<span class="mark">rganization Units validation and edition. Ideally
user management within their entity when this will be
decentralised.</span>

###  Teams

A team is a group of users that work towards a same goal (ex: group of
field agents that collect data in a same region).

The team creation feature is located in the main menu panel, in the
section “Admin”.

<img src="./media/image112.png" style="width:6.5in;height:3.19444in" />

Use the
<img src="./media/image1.png" style="width:1.29167in;height:0.4375in" />
icon to create a new team. Fill the form by entering the appropriate
information

<img src="./media/image100.png" style="width:2.3674in;height:2.54688in" />

If it is the first team you are creating, in the “Type” field, select
“Team of users”. Once selected, a new field named “Users” will appear,
allowing you to choose users who will be part of the team. Once done,
save the changes. The newly created team will appear in the list.
Members of the team are displayed in the team’s row.

<img src="./media/image15.png" style="width:2.09992in;height:2.79688in" />

<img src="./media/image43.png" style="width:6.5in;height:2.54167in" />

Once you’re done with creating teams and assigning users to each team,
you can now create teams of teams if needed. Teams of teams are created
the same way as Team of users by choosing “Team of teams” in the “Type”
field. Instead of “Users”, you’ll now have to choose “Team”. Select all
the teams part of the new team of teams.

Teams can be edited by clicking on the pencil icon
<img src="./media/image37.png" style="width:0.57292in;height:0.5625in" />or deleted by clicking on the
<img src="./media/image20.png" style="width:0.58333in;height:0.52083in" />button

## Logout 

Finally, you disconnect from the app by clicking on the “**logout”**
button.

<img src="./media/image34.png" style="width:7.53233in;height:3.57813in" />

# Iaso App

Bluesquare instantiates a Iaso app for each project, and these are
available through the PlayStore: [https://play.google.com/](https://play.google.com/).

Once you have downloaded the app, you connect to your project with the
same username and password you use to connect to Iaso web. The
information available in the mobile version is the same as in the web
version. However, don't forget to refresh the data when you connect.

The language of the application depends on the language of the device
used. You can change the language in the settings of your device
(mobile, tablet..).

The apps is structured as follows:

-   Homepage (where you arrive when you login or icon of the house)

    -   Setting

    -   Start

    -   Upload (cloud icon)

    -   Micro-planning

    -   Edit & view

As for the web version, we’ll first start with an overview of buttons
and then move to the different functionalities according to the app’s
structure.

## Quick overview of buttons

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<td><img src="./media/image108.png" style="width:0.41177in;height:0.4in" /></td>
<td>The left arrow button in the top left corner allows you to navigate
back to other levels in the pyramid.</td>
</tr>
<tr class="odd">
<th><img src="./media/image79.jpg"
style="width:0.5715in;height:0.4in" /></th>
<th>The Home icon button brings you directly back to the homepage, you
will see a list of all the forms you have filled out, and can filter
them by total, unfinished, finalised, uploaded.</th>
</tr>
<tr class="header">
<th><p><img src="./media/image2.jpg"
style="width:0.41026in;height:0.4in" /></p>
<h2 id="section-4" class="unnumbered"></h2>
<h2 id="section-5" class="unnumbered"><img src="./media/image23.jpg"
style="width:1.6875in;height:0.85417in" /></h2></th>
<th>The filter icon button allows you to view only a selection of
Organisation units depending on the type. If this is not set up, the
only option available is to see the whole health pyramid.</th>
</tr>
<tr class="odd">
<th><p><img src="./media/image68.png"
style="width:0.35417in;height:0.36458in" /></p>
<h2 id="section-6" class="unnumbered"><img src="./media/image56.jpg"
style="width:2.59896in;height:2.67429in" /></h2></th>
<th><p>The sort button allows you to sort the forms by name, period, or
encoding date</p>
<p>Increasing and Decreasing period = sort by date</p>
<p>Increasing and Decreasing encoding period = sort by encoding date</p>
<p>Increasing and Decreasing form name = sort by alphabetical
order</p></th>
</tr>
<tr class="header">
<th><img src="./media/image27.png"
style="width:0.4375in;height:0.4in" /></th>
<th>The Skip button allows you to navigate to the beginning or end of
the form.</th>
</tr>
<tr class="odd">
<th><img src="./media/image46.png"
style="width:0.41333in;height:0.4in" /></th>
<th>Save button allows you to save the data collected so far.</th>
</tr>
<tr class="header">
<th><img src="./media/image8.png"
style="width:0.50667in;height:0.4in" /></th>
<th>Upload button allows you to upload data to the server. Only
finalised forms will be uploaded.</th>
</tr>
<tr class="odd">
<th><img src="./media/image8.png"
style="width:0.43229in;height:0.46431in" /></th>
<th>Orange Menu button allows you to refresh the app data and view app
details</th>
</tr>
<tr class="header">
<th><img src="./media/image68.png"
style="width:0.4375in;height:0.35417in" /></th>
<th>White Menu button allows you to edit a form that has already been
started.</th>
</tr>
<tr class="odd">
<th><img src="./media/image8.png"
style="width:0.72917in;height:0.34375in" /></th>
<th>Start button allows you to start collecting data.</th>
</tr>
<tr class="header">
<th><img src="./media/image70.png"
style="width:1.01042in;height:0.34375in" /></th>
<th>Fill out form button allows you to select the form needed for the
organisation unit you are collecting data for.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## Homepage <img src="./media/image118.png" style="width:0.5715in;height:0.4in" />

#### List of forms

On the homepage are listed forms that have been accessed, either
completed, finalised… In the case of the first use, this page will be
blank and all filters will show “0”.

<img src="./media/image8.png" style="width:2in;height:4.45in" />

Click on the magnifying glass and type the name of a form you want to
see.

If you click on <img src="./media/image119.png" style="width:0.21875in;height:0.44792in" /> to the right of a form, you
can change the time period or the organisational unit. Each org unit can
have 1 or multiple forms attached to it. It’s possible to suggest org
units in the field if something is missing (source of truth is backed).

If you click on a form in this list, you can view it. If you click on a
question in a form, you can change the answer. You can choose whether or
not to save the changes when you exit the form. And at any time, you can
click <img src="./media/image80.png"style="width:0.24479in;height:0.24479in" /> to save the changes and
return to the Organization Unit page.

### Setting

Next to the upload button is a menu button that gives access to “Refresh
data”,“Change the App ID”, “Change the URL of the server”, “Logout”and
“About”.

For admins only : Change the App ID in order to login as a different
user. Bluesquare Developers can Change the URL of the server in order to
go to a playground for example.

Go to settings by clicking the 3 dots on the upper right corner of the
screen homepage.

<img src="./media/image87.png" style="width:2in;height:3.56311in" />

#### Refresh data

Click Refresh data to refresh the health pyramid, the available forms or
both.

<img src="./media/image110.png" style="width:2.1557in;height:3.39063in" />

Choose what you want to refresh to retrieve the last available data from
the server. You need to have access to the internet for this to work.
This may take a few minutes.

<img src="./media/image88.png" style="width:1.6695in;height:3.72675in" />

#### Logout

The logout option allows you to log out of the application. In this
case, you will have to re-enter your credentials the next time you use
it. This can be useful if several people use the same device but
different accounts. Otherwise, the application keeps your credentials.

#### About

The "About" option shows you the name and version of the application, as
well as information about ODK, the open source tool on which Iaso is
based.

### Start

From the main menu, tap on « Start» to get to the health structure and
start data entry.

#### Units Tab

In the “UNITS” tab you can navigate through the health pyramid of the
organisation unit you are collecting for. The health pyramid structure
can differ from one country to another. The button “Fill out a form”
will appear at applicable levels. For each level a small indicator tells
you how many Organisation Units exist in the level you are viewing.

<img src="./media/image92.png" style="width:1.96354in;height:3.26961in" />

Simply click on the pyramid level you are interested in and sub-levels
will appear.

##### Data collection

When you have selected the desired Organisation Unit, click on the “Fill
out a form”.

<img src="./media/image70.png" style="width:1.56265in;height:3.45313in" />

You will need to select from the list of available forms (if there are
more than one in the app).

<img src="./media/image62.png" style="width:1.56771in;height:3.48916in" />

You will then be prompted to select the period you are collecting for.

A confirmation message will allow you to check you have selected the
correct organisation unit, form and period. Click on “Proceed” if it is
correct, and on “Cancel” if you need to change a parameter.
<img src="./media/image83.jpg" style="width:2.02083in;height:3.88843in" />

Once you have selected the correct parameters go on to filling out the
form. Questions with a star (\*) are mandatory.
<img src="./media/image64.png" style="width:2in;height:2.03in" />

Some forms will ask you to “Get geographical coordinates”. To do this,
click on the “Get coordinates” button, wait for the coordinates to be as
precise as possible (this may take a few minutes) and then click on
“Save the coordinates”. <img src="./media/image14.png" style="width:2.04524in;height:4.56771in" />

<img src="./media/image22.png" style="width:2.47819in;height:3.16146in" /><img src="./media/image65.png" style="width:2.88266in;height:3.18229in" />

At the end of a form you may encounter a summary page where you can view
the points obtained for each question or section.

<img src="./media/image27.png" style="width:1.77in;height:3.92524in" />

When you get to the end, you can choose to “Mark the form as finalised”
or not by checking the box. Then click on “Save and Exit”. At the end of
the form, if you want to be able to review and correct the form, DON’T
mark it as finalised.

You can give a name to the form to make it easier to find it later -
NOTE - this is only for personal use to find the form. The name will not
be sent to the data management
system.<img src="./media/image46.png" style="width:2in;height:4.45in" />

The form will be saved and available from the main menu under
« Unfinished ».

##### How to interrupt data collection?

1. Option one

<img src="./media/image27.png" style="width:0.35417in;height:0.31771in" />

Tap on the three boxes with arrows in the top right corner of the screen

Then Tap on « Go to end »

Save the Form

You can give a name to the form to make it easier to find it later -
NOTE - This is only for personal use to find the form. The name will not
be sent to the data management system

The form will be saved and available from the main menu under
“Unfinished” or “Finalised”.

You are then directed to the screen showing the forms you have filled in
for the Organisation Unit you are working on.
<img src="./media/image46.png" style="width:1.60938in;height:3.59107in" />

<img src="./media/image68.png" style="width:1.57813in;height:3.50321in" />

2. Option two

If you want to leave the form, click on the arrow at the bottom of your
device. You will be asked if you wish to save the changes or not. Again,
you can choose to save the form.

If you want to leave the form without saving this is the way to do it.
Simply click on “Ignore changes” and you will leave the form. However if
the form was previously saved only the changes since the last save will
not be saved.

<img src="./media/image60.png" style="width:1.76916in;height:3.94271in" />

If there are many forms and you are looking for a specific one you can
click on the search button and type in the name of the form.

<img src="./media/image13.png" style="width:1.76963in;height:3.94271in" />

If you click on the three dots on the right of a form, you can change
theOrganisation Unit.<img src="./media/image38.png" style="width:1.78646in;height:3.97631in" />

If you click on a form in this list, you can view it. If you click on a
question in a form you can edit the answer. You can choose to save
changes or not when exiting the form. And at any point you can click on
the “Save the Form” button, your changes will be saved and you will
return to the Organisation Unit page.

#### Forms Tab

In the “FORMS” tab you can see the list of forms that have been filled
in for the organisation unit you have navigated to in the “UNITS” tab.
If you have not started collecting data for the organisation unit yet,
there will be no forms in the “FORMS” tab.

<img src="./media/image81.jpg" style="width:2in;height:2.61458in" /><img src="./media/image99.jpg" style="width:2.09169in;height:2.61979in" /><img src="./media/image8.png" style="width:0.39323in;height:0.3125in" />

### Upload

Once you have collected the data, the forms need to be uploaded to the
server so the data can be used in the system. In order to do so, you
will need to have access to the internet.

#### Finalise forms

-   To submit a Form your first need to finalise it

-   Click on “Unfinished” on the homepage

-   Open the Form you want to finalise

-   Review the form until the end

-   If the data is correct, tick the box « Mark Form as Finalised »

-   The Form will be available from the main menu under « Finalised »

#### Send data

-   Once data entry is complete, connect your tablet or phone to wifi or
    > turn mobile data on

-   Tap on the cloud button (top right) to upload the forms

You will be prompted to confirm the forms upload.

<img src="./media/image21.png" style="width:1.76563in;height:3.9363in" />

Note that only the forms that have been finalised will be uploaded to
the server.

-   All the finalised forms will be sent to the server

-   You can view all Sent forms from on the homepage under « Uploaded ».

### Micro-planning

Example of a scenario “July schedules" in the context of micro-planning:

<img src="./media/image33.png" style="width:1.60938in;height:3.41279in" /><img src="./media/image55.png" style="width:1.66146in;height:3.41134in" />

-   Gives the field agent information about where he needs to go and the
    > form he needs to fill out.

There are 2 types of support to help him during the navigation

-   The compass, which is especially useful when you are close to your
    > destination, has no internet access and no off-line map (in the
    > village for example).

-   The Google maps browser

> Once on the spot (household for example) the agent will fill in the
> form (content decided in advance by the customer).
>
> It is possible to add a photo or a geo point for example.

-   Gives the manager an overview on the the status of the schedules he
    > is responsible for / the advancements of the campaign

Number of finalised, unfinished, sent forms according to the colours.

> Once finalised, the agent will be able to upload the data on the
> server (need to have internet at this stage).

### Edit and view

#### View Sent Forms

From the main menu, go to « Uploaded »

You can see the name of the forms, day and time they were sent

#### Edit a saved form

-   Tap on “Unfinished” on the homepage

-   Select the Form

-   Tap on “Go to Start”

-   Start re-entering data until you reach the end of the Form

-   At the end of the form, if you want to be able to review and correct
    > the form, DONT mark it as finalised

-   You can give a name to the form to make it easier to find it later

-   The form will be saved and available from the main menu under
    > « Unfinished»

#### Edit a finalised form

-   Tap on “Finalised” on the homepage

-   Select the Form

-   Tap on « Go to Start »

-   Start re-entering data until you reach the end of the form

-   At the end of the form, if you want to be able to review and correct
    > the form, DONT mark it as finalised.

-   You can give a name to the form to make it easier to find it later

-   The form will be saved and available from the main menu under
    > « Unfinished»

#### Review a Form

-   Tap on “Finalised” on the homepage

-   Select the Form

-   Scroll down to review data you have entered

-   If you need to modify data, tap on « Go To Start » and swap screens
    > until you reach the data you want to modify

-   At the end of the form, if you want to be able to review and correct
    > the form, DONT mark it as finalised.

-   You can give a name to the form to make it easier to find it later

-   The form will be saved and available from the main menu under
    > « Unfinished»

#### New Version 1.28

Better sending of forms in case of a very weak and / or intermittent
network.

For devices that have unsent forms, we've added a "forced download"
feature. To access it, you must activate "developer mode" by tapping 10
times on the application icon under the "about '' menu (under the three
dots) and then "Force resend all forms" will appear in the menu . This
option is not available by default to avoid re-sending data already
correctly sent, which will overwrite those already sent (and which could
therefore have been modified by an administrator in the meantime).
