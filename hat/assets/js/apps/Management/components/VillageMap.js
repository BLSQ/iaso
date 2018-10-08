/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import L from 'leaflet';
import geoUtils from '../../Plannings/utils/geo';
import { getZsName, clone } from '../../../utils';


// map base layers
const tileOptions = { keepBuffer: 4 };
const arcgisPattern = 'https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{z}/{y}/{x}.jpg';
const BASE_LAYERS = {
    blank: L.tileLayer(''),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileOptions),
    'arcgis-street': L.tileLayer(arcgisPattern.replace('{}', 'World_Street_Map'), tileOptions),
    'arcgis-satellite': L.tileLayer(arcgisPattern.replace('{}', 'World_Imagery'), { ...tileOptions, maxZoom: 16 }),
    'arcgis-topo': L.tileLayer(arcgisPattern.replace('{}', 'World_Topo_Map'), { ...tileOptions, maxZoom: 17 }),
};


const MESSAGES = defineMessages({
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
});

const shapes = {
    province: new L.FeatureGroup(),
};


// at which zoom can be displayed in map
const zooms = {
    province: -1, // always in map
    zs: 7,
    as: 9,
};
const shapeOptions = (type, element) => ({
    pane: 'custom-pane-shapes',
    style: () => ({ className: String.raw`map-layer ${type}` }),
    onEachFeature: (feature, layer) => {
        element.addLayerEvents(layer, feature.properties);
    },
});

const plotOrHideLayer = (map, minZoom, type, geoJson, element) => {
    if (shapes[type]) {
        const layer = shapes[type];
        if (map.getZoom() > minZoom) {
            if (!map.hasLayer(layer)) {
                layer.on('click', (event) => {
                    if (!element.props.village) {
                        element.props.updateVillagePosition(
                            parseFloat(event.latlng.lat).toFixed(5),
                            parseFloat(event.latlng.lng).toFixed(5),
                        );
                    }
                });
                map.addLayer(layer);
            }
        } else if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    } else if (map.getZoom() > minZoom) {
        shapes[type] = new L.FeatureGroup();
        const shape = shapes[type];
        const minZoomTemp = zooms[type];
        shape.addLayer(L.geoJson(geoJson[type], shapeOptions(type, element)));
        shape.on('click', (event) => {
            if (!element.props.village) {
                element.props.updateVillagePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
            }
        });
        plotOrHideLayer(map, minZoomTemp, type, geoJson, element);
    }
};

class VillageMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            isFirstLoad: true,
        };
    }

    componentDidMount() {
        this.createMap();
        this.includeControlsInMap();
        this.includeDefaultLayersInMap();
        this.updateBaseLayer(this.props.baseLayer);
        this.fitToBounds();
        this.updateMap(this.props.village);
    }

    componentWillReceiveProps(nextProps) {
        const { map } = this;
        map.whenReady(() => {
            if (this.props.baseLayer !== nextProps.baseLayer) {
                this.updateBaseLayer(nextProps.baseLayer);
            }
            if (!this.props.village && nextProps.village) {
                this.updateMap(nextProps.village);
            }
        });
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    /*
***************************************************************************
* CREATE MAP
*************************************************************************** */

    createMap() {
        const map = L.map(this.mapNode, {
            attributionControl: false,
            zoomControl: false, // zoom control will be added manually
            scrollWheelZoom: false, // disable scroll zoom
            center: geoUtils.center,
            zoom: geoUtils.zoom,
            zoomDelta: geoUtils.zoomDelta,
            zoomSnap: geoUtils.zoomSnap,
        });

        // create panes to preserve z-index order
        map.createPane('custom-pane-shapes');
        map.createPane('custom-pane-markers');
        map.on('mouseup', () => {
            map.dragging.enable();
        }).on('click', (event) => {
            if (!this.props.village) {
                this.props.updateVillagePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
            }
        });
        this.map = map;
    }

    includeControlsInMap() {
        // The order in which the controls are added matters
        const { formatMessage } = this.props.intl;
        const { containers } = this.state;
        const { map } = this;

        // zoom bar control
        L.control.zoombar({
            zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
            zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
            fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
            fitToBounds: () => { this.fitToBounds(); },
            position: 'topleft',
        }).addTo(map);

        // control to visualize warnings
        const warningControl = L.control({ position: 'topright' });
        warningControl.onAdd = () => (L.DomUtil.create('div', 'hide-on-print'));
        warningControl.addTo(map);
        containers.warning = warningControl.getContainer();

        // metric scale
        L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

        // controls to visualize the shape/marker tooltip
        const tooltipSmallControl = L.control({ position: 'bottomleft' });
        tooltipSmallControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
        tooltipSmallControl.addTo(map);
        containers.tooltipSmall = tooltipSmallControl.getContainer();
    }

    includeDefaultLayersInMap() {
        const { map } = this;
        this.shapesGroup = new L.FeatureGroup();
        this.villageGroup = new L.FeatureGroup();

        map.addLayer(this.shapesGroup);
        map.addLayer(this.villageGroup);

        const shape = shapes.province;
        const minZoom = zooms.province;
        const {
            geoJson,
        } = this.props;
        shape.addLayer(L.geoJson(geoJson.provinces, shapeOptions('provinces', this)));
        shape.on('click', (event) => {
            if (!this.props.village) {
                this.props.updateVillagePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
            }
        });
        if (minZoom < 0) {
            map.addLayer(shape);
            this.state.defaultBounds = shape.getBounds();
        }
        L.DomEvent.on(map, 'zoomend', () => {
            plotOrHideLayer(map, zooms.zs, 'zs', geoJson, this);
            plotOrHideLayer(map, zooms.as, 'as', geoJson, this);
        });
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */

    updateBaseLayer(baseLayer) {
        const { map } = this;
        Object.keys(BASE_LAYERS).forEach((key) => {
            const layer = BASE_LAYERS[key];
            if (key === baseLayer) {
                layer.addTo(map);
            } else if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
    }


    updateMap(village) {
        const { map } = this;
        this.villageGroup.clearLayers();
        const color = 'blue';
        if (village && village.latitude && village.longitude) {
            const newVillage = L.circle([village.latitude, village.longitude], {
                color,
                fillColor: color,
                fillOpacity: 0.5,
                radius: 500,
                pane: 'custom-pane-markers',
            }).on('mousedown', () => {
                map.dragging.disable();
                map.on('mousemove', (event) => {
                    if (!map.dragging._enabled) {
                        newVillage.setLatLng([event.latlng.lat, event.latlng.lng]);
                    }
                });
            }).on('mouseup', (event) => {
                if (!map.dragging._enabled) {
                    this.props.updateVillagePosition(
                        parseFloat(event.latlng.lat).toFixed(5),
                        parseFloat(event.latlng.lng).toFixed(5),
                    );
                }
            });
            newVillage.addTo(this.villageGroup);
        }

        if (this.state.isFirstLoad) {
            this.fitToBounds();
            this.setState({
                isFirstLoad: false,
            });
        }
    }

    updateTooltipSmall(item) {
        const { map } = this;
        const currentZoom = map.getZoom();
        if (item) {
            if (item.ZS) {
                const currentZS = this.props.geoJson.zs.features.filter(z => parseInt(z.properties.pk, 10) === item.ZS)[0];
                this.state.containers.tooltipSmall.innerHTML = `AS: ${item.name} - ZS: ${currentZS.properties.name}`;
            } else {
                this.state.containers.tooltipSmall.innerHTML = `${currentZoom <= zooms.zs ? 'Province' : 'ZS'}: ${item.name}`;
            }
        } else {
            this.state.containers.tooltipSmall.innerHTML = '';
        }
    }


    /*
***************************************************************************
* ACTIONS
*************************************************************************** */

    fitToBounds() {
        const { map } = this;

        // maximum zoom allowed to fit to relevant markers
        const MAX_ZOOM = 13;


        setTimeout(() => {
            const bounds = this.villageGroup.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom: 10, padding: [100, 100] });
            }
            map.invalidateSize();
        }, 1);
    }

    /*
***************************************************************************
* HELPERS
*************************************************************************** */

    addLayerEvents(layer, item) {
        const { map } = this;
        layer.on({
            click: (event) => {
                L.DomEvent.stop(event);
            },
            contextmenu: (event) => {
                L.DomEvent.stop(event);
            },
            mouseover: (event) => {
                L.DomEvent.stop(event);
                if (map.dragging._enabled) {
                    this.updateTooltipSmall(item);
                }
            },
            mouseout: (event) => {
                L.DomEvent.stop(event);
                this.updateTooltipSmall();
            },
        });
    }

    injectI18n(component) {
        // we need to wrap it with `IntlProvider` to use i18n features
        const { locale, messages } = this.props.intl;

        return (
            <IntlProvider locale={locale} messages={messages}>
                {component}
            </IntlProvider>
        );
    }

    render() {
        return <div ref={(node) => { this.mapNode = node; }} className="map-container" />;
    }
}
VillageMap.defaultProps = {
    geoJson: {},
    village: undefined,
};

VillageMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    geoJson: PropTypes.object,
    intl: intlShape.isRequired,
    village: PropTypes.object,
    updateVillagePosition: PropTypes.func.isRequired,
    filters: PropTypes.array.isRequired,
};

export default injectIntl(VillageMap);
