import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
    markerClustering: {
        id: 'iaso.map.title.markerClustering',
        defaultMessage: 'Clustering',
    },
    layersTitle: {
        id: 'iaso.tile.title',
        defaultMessage: 'Map layers',
    },
    protomaps: {
        id: 'iaso.tile.protomaps',
        defaultMessage: 'Protomaps (Bluesquare)',
    },
    protomapsLight: {
        id: 'iaso.tile.protomaps.light',
        defaultMessage: 'Light',
    },
    protomapsDark: {
        id: 'iaso.tile.protomaps.dark',
        defaultMessage: 'Dark',
    },
    protomapsWhite: {
        id: 'iaso.tile.protomaps.white',
        defaultMessage: 'White',
    },
    protomapsGrayscale: {
        id: 'iaso.tile.protomaps.grayscale',
        defaultMessage: 'Grayscale',
    },
    protomapsBlack: {
        id: 'iaso.tile.protomaps.black',
        defaultMessage: 'Black',
    },
    osm: {
        id: 'iaso.tile.osm',
        defaultMessage: 'Open Street Map',
    },
    'arcgis-street': {
        id: 'iaso.tile.arcgis.street',
        defaultMessage: 'ArcGIS Street Map',
    },
    'arcgis-satellite': {
        id: 'iaso.tile.arcgis.satellite',
        defaultMessage: 'ArcGIS Satellite Map',
    },
    'arcgis-topo': {
        id: 'iaso.tile.arcgis.topo',
        defaultMessage: 'ArcGIS Topo Map',
    },
    title: {
        id: 'iaso.map.title.markerClustering',
        defaultMessage: 'Clustering',
    },
    parent: {
        id: 'iaso.label.parent',
        defaultMessage: 'Parent',
    },
    // same ids as the leaflet controls (`CustomZoomControl`, the dialogs)
    zoomIn: {
        id: 'iaso.label.zoomIn',
        defaultMessage: 'Zoom in',
    },
    zoomOut: {
        id: 'iaso.label.zoomOut',
        defaultMessage: 'Zoom out',
    },
    fitToBounds: {
        id: 'map.label.fitToBounds',
        defaultMessage: 'Center the map',
    },
    boxZoom: {
        id: 'map.label.zoom.box',
        defaultMessage: 'Draw a square on the map to zoom in to an area',
    },
    fullscreen: {
        id: 'iaso.map.fullscreen',
        defaultMessage: 'Fullscreen',
    },
    exitFullscreen: {
        id: 'iaso.label.exitFullscreen',
        defaultMessage: 'Exit fullscreen',
    },
    locationNotInShape: {
        id: 'iaso.map.locationNotInShape',
        defaultMessage:
            "The location is not within the bounds of the parent's shape.",
    },
});

export default MESSAGES;
