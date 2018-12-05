
import L from 'leaflet';
import React, { Component } from 'react';
import { defineMessages, IntlProvider } from 'react-intl';


const tileOptions = { keepBuffer: 4 };
const arcgisPattern = 'https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{z}/{y}/{x}.jpg';
const BASE_LAYERS = {
    blank: L.tileLayer(''),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileOptions),
    'arcgis-street': L.tileLayer(arcgisPattern.replace('{}', 'World_Street_Map'), tileOptions),
    'arcgis-satellite': L.tileLayer(arcgisPattern.replace('{}', 'World_Imagery'), { ...tileOptions, maxZoom: 16 }),
    'arcgis-topo': L.tileLayer(arcgisPattern.replace('{}', 'World_Topo_Map'), { ...tileOptions, maxZoom: 17 }),
};


export const MESSAGES = defineMessages({
    'fit-to-bounds': {
        defaultMessage: 'Center to relevant villages',
        id: 'locator.label.fitToBounds',
    },
    'box-zoom-title': {
        defaultMessage: 'Draw a square on the map to zoom in to an area',
        id: 'locator.label.zoom.box',
    },
    'info-zoom-title': {
        defaultMessage: 'Current zoom level',
        id: 'locator.label.zoom.info',
    },
    'shape-loader': {
        defaultMessage: 'Chargement des délimitations',
        id: 'main.label.shape-loader',
    },
    'endemic-population': {
        defaultMessage: 'Population endémique',
        id: 'locator.label.endemic-population',
    },
});

export const onResizeMap = (width, height, exportControl, map, filename) => {
    const customSize = {
        width,
        height,
        className: 'A4Landscape page',
        tooltip: 'PNG',
    };
    if (exportControl) {
        map.removeControl(exportControl);
    }
    const newExportControl = L.easyPrint({
        position: 'topleft',
        sizeModes: [customSize],
        hideControlContainer: true,
        title: 'Télécharger',
        exportOnly: true,
        filename,
    }).addTo(map);
    return newExportControl;
};

export const defaultFitToBound = (map, bounds, maxZoom) => {
    setTimeout(() => {
        if (bounds.isValid()) {
            map.fitBounds(bounds, { maxZoom, padding: [50, 50] });
        }
        map.invalidateSize();
    }, 1);
};

export const updateBaseLayer = (map, baseLayer) => {
    Object.keys(BASE_LAYERS).forEach((key) => {
        const layer = BASE_LAYERS[key];
        if (key === baseLayer) {
            layer.addTo(map);
        } else if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    });
};

export const includeControlsInMap = (component, map, hasLargeTooltip = false) => {
    const { formatMessage } = component.props.intl;
    const tempContainer = component.state.containers;
    // The order in which the controls are added matters
    // zoom bar control
    L.control.zoombar({
        zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
        zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
        fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
        fitToBounds: () => { component.fitToBounds(); },
        position: 'topleft',
    }).addTo(map);

    // control to visualize warnings
    const warningControl = L.control({ position: 'topright' });
    warningControl.onAdd = () => (L.DomUtil.create('div', 'hide-on-print'));
    warningControl.addTo(map);
    tempContainer.warning = warningControl.getContainer();

    // metric scale
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    // controls to visualize the shape/marker tooltip
    const tooltipSmallControl = L.control({ position: 'bottomleft' });
    tooltipSmallControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
    tooltipSmallControl.addTo(map);
    tempContainer.tooltipSmall = tooltipSmallControl.getContainer();

    if (hasLargeTooltip) {
        const tooltipLargeControl = L.control({ position: 'bottomleft' });
        tooltipLargeControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
        tooltipLargeControl.addTo(map);
        tempContainer.tooltipLarge = tooltipLargeControl.getContainer();
    }
};

