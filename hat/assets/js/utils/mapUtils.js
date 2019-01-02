
import L from 'leaflet';
import { defineMessages } from 'react-intl';
import geoUtils from './geo';

export const genericMap = mapNode => L.map(mapNode, {
    attributionControl: false,
    zoomControl: false, // zoom control will be added manually
    scrollWheelZoom: false, // disable scroll zoom
    center: geoUtils.center,
    zoom: geoUtils.zoom,
    zoomDelta: geoUtils.zoomDelta,
    zoomSnap: geoUtils.zoomSnap,
});

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
    catch: {
        defaultMessage: 'Piège',
        id: 'locator.label.catch',
    },
    site: {
        defaultMessage: 'Site',
        id: 'locator.label.site',
    },
});

export const onResizeMap = (width, height, exportControl, currentMap, filename) => {
    const customSize = {
        width,
        height,
        className: 'A4Landscape page',
        tooltip: 'PNG',
    };
    if (exportControl) {
        currentMap.removeControl(exportControl);
    }
    const newExportControl = L.easyPrint({
        position: 'topleft',
        sizeModes: [customSize],
        hideControlContainer: true,
        title: 'Télécharger',
        exportOnly: true,
        filename,
    }).addTo(currentMap);
    return newExportControl;
};

export const defaultFitToBound = (currentMap, bounds, maxZoom) => {
    setTimeout(() => {
        if (bounds.isValid()) {
            currentMap.fitBounds(bounds, { maxZoom, padding: [50, 50] });
        }
        currentMap.invalidateSize();
    }, 1);
};

export const updateBaseLayer = (currentMap, baseLayer) => {
    Object.keys(BASE_LAYERS).forEach((key) => {
        const layer = BASE_LAYERS[key];
        if (key === baseLayer) {
            layer.addTo(currentMap);
        } else if (currentMap.hasLayer(layer)) {
            currentMap.removeLayer(layer);
        }
    });
};


export const includeControlsInMap = (component, currentMap, hasLargeTooltip = false) => {
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
    }).addTo(currentMap);

    // control to visualize warnings
    const warningControl = L.control({ position: 'topright' });
    warningControl.onAdd = () => (L.DomUtil.create('div', 'hide-on-print'));
    warningControl.addTo(currentMap);
    tempContainer.warning = warningControl.getContainer();

    // metric scale
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(currentMap);

    // controls to visualize the shape/marker tooltip
    const tooltipSmallControl = L.control({ position: 'bottomleft' });
    tooltipSmallControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
    tooltipSmallControl.addTo(currentMap);
    tempContainer.tooltipSmall = tooltipSmallControl.getContainer();

    if (hasLargeTooltip) {
        const tooltipLargeControl = L.control({ position: 'bottomleft' });
        tooltipLargeControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
        tooltipLargeControl.addTo(currentMap);
        tempContainer.tooltipLarge = tooltipLargeControl.getContainer();
    }
};

// at which zoom can be displayed in map
export const zooms = {
    province: -1, // always in map
    zone: 7,
    area: 9,
    zs: 7,
    as: 9,
};

export const includeDefaultLayersInMap = (component) => {
    //
    // include relevant and constant layers
    //
    const tempComponent = component;
    const { map } = tempComponent;
    tempComponent.villageGroup = new L.FeatureGroup();
    map.addLayer(tempComponent.villageGroup);
    tempComponent.unselectedVillageGroup = new L.FeatureGroup();
    map.addLayer(tempComponent.unselectedVillageGroup);
    // assign labels overlay using the existent labels group

    //
    // plot the ALL boundaries
    //
    const shapes = {
        province: new L.FeatureGroup(),
    };

    const shapeOptions = type => ({
        pane: 'custom-pane-shapes',
        style: () => ({ className: String.raw`map-layer ${type}` }),
        onEachFeature: (feature, layer) => {
            tempComponent.addLayerEvents(layer, feature.properties);
        },
    });

    geoUtils.getShape('province', tempComponent, shapes, shapeOptions, zooms, map).then((shape) => {
        tempComponent.state.defaultBounds = shape.getBounds();
    });

    const plotOrHideLayer = (minZoom, type) => {
        if (shapes[type]) {
            const layer = shapes[type];
            if (map.getZoom() > minZoom) {
                if (!map.hasLayer(layer)) {
                    map.addLayer(layer);
                }
            } else if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        } else if (map.getZoom() > minZoom) {
            shapes[type] = new L.FeatureGroup();
            geoUtils.getShape(type, tempComponent, shapes, shapeOptions, zooms, map).then((minZoomTemp) => {
                plotOrHideLayer(minZoomTemp, type);
            });
        }
    };

    L.DomEvent.on(map, 'zoomend', () => {
        plotOrHideLayer(zooms.zone, 'zone');
        plotOrHideLayer(zooms.area, 'area');
    });
};

