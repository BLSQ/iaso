# Front-end guidelines

## Prerequisite

First of all make sure your eslint, prettier, typescript environnement is set properly.

On VSC code you can format code following IAOS rules while saving in the settings:

    "[javascript]": {
        "editor.formatOnSave": true,
    },
    "[typescript]": {
        "editor.formatOnSave": true,
    },

Make sure you installed eslint extension too.  
On each file you can have only one component.  
Use constants, and config files to store static data.  
Don't be afraid to split your code into smaller parts, using understandable naming convention. It will help to understand what you are doing in your code.  

## Legacy

Class component, redux, provider are still old way to create features in IASO.  
Please use `hooks`, `typescript` and `arrow component`.  
Redux can still be used with state that needs to be available everywhere in the application (current user, UI constants and states, ...).  
We already have a lot of typing done in each domain of the application (forms, submissions, org units, ... )

## Bluesquare-components

Lots of components used in IASO has been moved to a separate [repo](https://github.com/BLSQ/bluesquare-components).  
We tried to be the most generic has possible in this repo, people from outside IASO should be able to use it in their own project.  
To use it locally, checkout the repo on the same level has ISO and run:  `LIVE_COMPONENTS=true pm run dev` in IASO folder.  
This will use directly the code from your local repo.  
To make it available too everybody you have to build new files with `npm run clean && npm run build` in bluesquare-component folder. 

## Architecture

Main index file is located here: `hat/assets/js/apps/Iaso/index`  
This is the entrypoint of the app, setting up providers, theme, react-query query client, custom plugins, redux,...  

**`components`**  
Used to store generic components that can be used everywhere, like `inputComponent`, `buttons`, ...

**`domains`**  
For every big feature entity in IASO (forms, org units, plannings, ...) we have a domain folder allowing to display related pages.  
- `index` is generally used to display a list of items 
- `details` the details of an item
- `config` used to store constants for the domain (columns, default order, ...)
- `hooks`: dedicated hooks to make requests or compute specitic data for the domain
- `components`: mostly intermediate components using smaller ones to construct domain page
- `messages`: translations messages used for this specific domain
config: used to store constants like defaultOrder, columns, 'baseUrls' 
- `types`: All types related to the domain


## Maps

We are using [leaflet](https://leafletjs.com/reference.html) latest version and [react-leaflet](https://react-leaflet.js.org/docs/v3/start-introduction/) (LTS version 3).
To use latest version of react-leaflet we need to upgrade to react 18.

Styles are located in `bluesquare-components`, you have to import it on each map:

    const useStyles = makeStyles(theme => ({
        mapContainer: {
            ...commonStyles(theme).mapContainer,
        },
    }));

### From react-leaflet

**MapContainer**

The main container of the Map.
Props we use:
- `bounds`: not required, bounds of markers and shapes displayed, used by fit to bound, doc [here](https://leafletjs.com/reference.html#latlngbounds).
- `boundsOptions`: not required, options related to bounds, doc [here](https://leafletjs.com/reference.html#fitbounds-options).
- `zoomControl`: required and set to `false`, in order to use the `CustomZoomControl`.
- `whenCreated`: not required,to use a ref of the map in the same component as the MapContainer, you get it by doing
    whenCreated={mapInstance => {
        map.current = mapInstance;
    }}

default props:

    doubleClickZoom={false}
    scrollWheelZoom={false}
    maxZoom={currentTile.maxZoom}
    style={{ height: '100%' }}
    center={[0, 0]}
    zoomControl={false}
    keyboard={false}
    bounds={bounds}
    boundsOptions={boundsOptions}

**Scalecontrol**

Used to display a scale on the bottom left of the map.

Props we use:
- `imperial`: always set to `false`

We use other component from react-leaflet not listed here as they are optionnal and used like describe in their [docs](https://react-leaflet.js.org/docs/v3/api-components/).


### Custom components

**CustomZoomControl**  

This will display an extended zoom control on the top left of the map.
You can zoom in and out, select an area to zoom in and fit the map to the bounds of the map.  

Props:
- `bounds`: not required, computed bounds displayed on the map, doc [here](https://leafletjs.com/reference.html#latlngbounds).
- `boundsOptions`: not required, options related to bounds, doc [here](https://leafletjs.com/reference.html#fitbounds-options).
- `bound`: not required, a boolean to fit to bounds on load, not working if bounds stays undefined.

**CustomTileLayer + TilesSwitchDialog**  

Control to display a dialog allowing to change the tile layer of the map, on the top right of the map
Those twot components are going together, maybe we should refactor it to a single component.

CustomTileLayer Props:
- `currentTile`: required, active tile of the map, usually setted in the map itself with a `useState`.

TilesSwitchDialog Props:
- `currentTile`: required, active tile of the map, usually setted in the map itself with a `useState`.
- `setCurrentTile`: required, method to update current tile on the map.

**MapToggleTooltips**

A switch to show or hide tooltips on the map.

Props:

- `showTooltip`: required, usually setted in the map itself with a `useState`.
- `setShowTooltip`: required, method to showTooltip or not.

**MapToggleFullscreen**  

A switch to set the map fullscreen or not.

Props:

- `isMapFullScreen`: required, usually setted in the map itself with a `useState`.
- `setIsMapFullScreen`: required, method to set into fullscreen or not.

**MapToggleCluster**

A switch to allow clustering or not of marker on the map.
You should use `MarkerClusterGroup` from `react-leaflet-markercluster` 

Props:

- `isClusterActive`: required, usually setted in the map itself with a `useState`.
- `setIsClusterActive`: required, method to enable custering of markers or not.

**MarkerComponent / CircleMarkerComponent**  
Components used to display a marker on the map.
Props:
- see js file for not required props, mainly the same props as `Marker` from react-leaflet.
- `PopupComponent`: not required, Popup used while clicking on the marker
- `TooltipComponent`: not required, Tooltip used while hovering the marker
- `item`: required, an object with `latitude` an `longitude` arguments, those are numbers


**MarkersListComponent**  
Used to display a list of markers

Props:
- `markerProps`: not required, props spreaded to the marker
- `items`: required, array of items use by previous component
- `PopupComponent`: not required, Popup used while clicking on the marker
- `TooltipComponent`: not required, Tooltip used while hovering the marker
- `onMarkerClick`: not required, method applied while clicking on the marker on the map
- `isCircle`: not required, display marker as a circle or not
- `onContextmenu`: not required, method applied while right clicking on the marker on the map


### Tables

Most tables we use need to support filters and deep linking. We have a `TableWithDeepLinking` component for that purpose, which is a wrapper on the `Table` from Bluesuare-components.

The typical props to pass are:
- `data`: the table data. Usually originate s from a `react-query` hook
- `page`: the current page. Usually returned by the API
- `pageSize`: the amount of rows to display on each page. Also comes from the API
- `count`: the total amount of items in the page. From the API
- `pages: total number of pages. From the API
- `baseUrl`: the baseUrl the table will redirect to 
- `params`: the params of the current location. `TableWithDeepLink` will combine them with `baseUrl`to redirect to the correct location
- `extraProps`: an object. The `loading` key will be used to manage the table's loading state. Other values will force a table re-render when they change (similar to `useEffect` deps array), which can be useful in some situations
- `columns`: an array of objects of type `Column` (imported from bluesquare-components). It's usually defined in a custom hook in order to easily handle translations.

**Note: `useDeleteTableRow`** 
When performing `DELETE` operations from the table that will reduce the amount of table rows, we can run into a pagination bug. To avoid it, use `useDeleteTableRow` in the `useDelete<whatever>` hook that will return the delete function:

```javascript
export const useDeleteWhatever = (
    params: Record<string, any>,
    count: number,
): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        params,
        pageKey: 'whateverPage', // optional, will default to "page"
        pageSizeKey: 'whateverPageSize', //optional, will default to "pageSize"
        count,
        invalidateQueries: ['whatever'], // optional
        baseUrl: baseUrls.whatever,
    });
    return useSnackMutation({
        mutationFn: deleteWhatever,
        options: { onSuccess },
    });
};
```

## Code style

- prefer `type?:string` to `type: string | undefined`
- prefer `const myVar = otherValue??"placeholder` to `let myVar = "placeholder" if(otherVAlue){myVar = otherValue}`
- function names should include a verb:
```javascript
// BAD
const username = user => user.firstname + user.lastname

// GOOD
const makeUsername = user => user.firstname + user.lastname
```



## Remarks

- order translations by alphanumeric
- spacing is by default theme.spacing(2)
- do not use Grid everywhere or too much
- all the calls to the api without query params should end by '/'
- in routes.js, the `params` listed are ordered, meaning you can get a 404 when they are not in the right order. Related to this, the `paginationPathParams` that we spread in most routes should come first, right after the `accountId` to avoid getting 404 because of automatic redirections
