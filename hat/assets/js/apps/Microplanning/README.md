# Microplanning tool

The aim of the work on the Microplanning tool is to provide a simple, easy to
use interface through which a planner can produce a list of villages which
should be visited by an individual team on a HAT itinérance.

The target user of the tool is the provincial coordinator.

This tool is strongly inspired by the existing [QGIS tool](http://www.qgis.org).


## Process: QGIS vs Dashboard tool

Before the campaigns start, several campaigns in advance are planned.

The planning process follows the basic steps below using a map-based interface.


----
The planner selects villages which have had a confirmed case of HAT in the
last 5, 3 or 1 years.

  __Dashboard: The tool allows to “highlight” villages with HAT cases in
  certain years. The “Select villages around confirmed HAT cases” button
  implements a shortcut to select all those villages in one time.__

  * If a village has a case in the last 3 years - they must be visited
  annually until there have been no cases for 5 years.

  * Villages that had cases 4-5 years ago but not more recently, need to
  be visited once more and then can be struck off the list if no more cases
  are found.


----
On the QGIS map, the number of cases in a particular location is indicated by
the radius of the dot, a larger radius corresponding to more cases. Irrespective
of the size of the dot - all areas within the buffer zone must be visited.

  __Dashboard: The size of the dot depends on the village type, the colour
  indicates if there are cases or not, to know the last case year and the numbers
  the user should pass over the dot or click on it to display all the info
  gathered for that village.__


----
The planner adds a buffer to the above villages to identify which neighbouring
villages count as at risk. The number of cases does not affect the size of the
buffer zone.

  __Dashboard: The “highlight buffer zone” is drawn when the “Select villages”
  option is enabled.__


----
The buffer zone is configurable between 1 and 5 km in radius.

  __Dashboard: There is no limit on the buffer zone size and can be
  manually adjusted.__


----
The villages with confirmed HAT cases and those in the buffer zones indicate
which area should be included in the campaign.


----
The planner may then choose to add in some additional neighbouring villages
which do not directly fall in the catchment area of the buffer. In QGIS, this
is done by drawing a Polygon around any areas additionally targeted. The number
of villages added in this polygon-drawing exercise is usually pretty small.

  __Dashboard: Instead of drawing a polygon the tool draws a dynamic buffer
  zone that follows the mouse movements. Clicking on it select/deselect the
  villages within the buffer zone.__


----
The planner exports a list of all villages selected.

  __Dashboard: The list is exported in Excel format.__

The list includes:
  * Province
  * Zone de santé
  * Aire de santé
  * Location name
  * Population
  * Year of last confirmed HAT case
  * Number of HAT cases in that year


----
The planner uses this list to plan a route for the data collectors, taking
into account how many participants the teams can cover on a single day. This
happens offline, in an excel file. The planner keeps selecting locations until
the teams are at capacity. The routes are planned based on the average capacity
of a team per team type. E.g. if there are 3 screeners in a team and a screener
can cover on average 20000 participants per year, they will keep planning until
20000 participants have been included. Each village has a population estimate.

  __Dashboard: Every time a new village is added to the list the number of
  selected villages and the estimated population is updated. During planning
  process the planner has a view of the covered area and the possible number of
  participants.
  The population estimate is uploaded within the location dbf files.__


----
Once the campaigns have started, the planner checks progress on a regular basis
by overlaying information on which locations have been visited (and how many
times). The planner can then generate a new list which marks which locations
have been visited and which are outstanding.


## Limitations of the QGIS and Dashboard tools

The QGIS tool is very useful, but has a few downsides:

- The open source software solution has a lot of options and requires
  specialised training to use.

  __Dashboard: Simplifies user interface.__


- Simultaneous visibility of multiple zones - occasionally, a village near to
  a zonal border may be an at risk village. This means that the buffer zone may
  extend into a neighbouring province and that villages in the neighbouring
  province should be scheduled for a visit.

  __Dashboard: Supports cross-zonal planning.__


- Selections are temporary - as the application is desktop-based it is hard
  to share the list selected with others and must be reselected each time.

  __Dashboard: This is still an issue but it is also possible to print or to
  export as a pdf file the current map view.__


## Data sources

The necessary datasets are:

  * The cases dataset, uploaded using the Dashboard tools.

  * The locations dataset, (includes: official names, classification population,
  gps coordinates...), also uploaded using the Dashboard tools.

  * The province, zone and aire de santé boundaries, condensed in
  the [topojson](https://github.com/topojson/topojson) file:
  `utils/shapes.json`. *Manually generated*.

*The official source of geolocation information is deemed to be the shapefiles
produced by UCLA from official PNLTHA lists.*


### `shapes.json`

In spite of the two first datasets can be easily updated, the third one implies
more effort. The province, zone and aire de santé shapefiles should be joined
into one [topojson](https://github.com/topojson/topojson) file with this schema:

The **`objects`** are:
  - **`provinces`**
  - **`zones`**
  - **`areas`**

Their **`properties`** are:
  - **`OLD_PROV`**
  - **`NEW_PROV`**
  - **`ZS`** (only for `zones` and `areas`)
  - **`AS`** (only for `areas`)


```
{
  "objects": {
    "provinces": {
      "geometries": [
        {
          "properties": {
            "OLD_PROV": "---",
            "NEW_PROV": "---"
          },
          ... «rest of properties»
        },
        ... «rest of properties»
      ],
      ... «rest of properties»
    },
    "zones": {
      "geometries": [
        {
          "properties": {
            "OLD_PROV": "---",
            "NEW_PROV": "---",
            "ZS": "---"
          },
          ... «rest of properties»
        },
        ... «rest of properties»
      ],
      ... «rest of properties»

    },
    "areas": {
      "geometries": [
        {
          "properties": {
            "OLD_PROV": "---",
            "NEW_PROV": "---",
            "ZS": "---",
            "AS": "---"
          },
          ... «rest of properties»
        },
        ... «rest of properties»
      ],
      ... «rest of properties»

    },
    ... «rest of properties»
  },
  ... «rest of properties»
}

```

To visualize the shapefiles or topojson files online use: http://mapshaper.org.


## Credit

Brought to you by [eHealth Africa](http://ehealthafrica.org/)
— good tech for hard places.

## License

Apache-2.0
