/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import L from 'leaflet';
import * as topojson from 'topojson';
import geoUtils from '../../Plannings/utils/geo';
import * as zoomBar from '../../Plannings/components/leaflet/zoom-bar';
import { getMonthName } from '../utils/routeUtils';


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

const MapDatas = (coordination) => {
    const tempCoordinations = coordination;
    const tempAreas = [];
    coordination.current.areas.features.map((area) => {
        const tempArea = area;
        coordination.workzones.map((workzone) => {
            workzone.as_list.map((workingArea) => {
                if (parseInt(tempArea.properties.pk, 10) === workingArea.id) {
                    tempArea.properties.workzoneId = workzone.id;
                    tempArea.properties.workzone = workzone.name;
                    tempArea.properties.workZoneIsNotFull = workzone.total_capacity < workzone.total_population;
                }
                return null;
            });
            return null;
        });
        tempAreas.push(tempArea);
        return null;
    });
    tempCoordinations.current.areas = tempAreas;
    return tempCoordinations;
};

const polygonsColor = {
    notFull: 'red',
    full: 'green',
    workzone: '#007fff',
    notAssigned: '#898789',
};

class MacroMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            layers: {
                villages: new L.FeatureGroup(),
            },
        };
    }

    componentDidMount() {
        this.createMap();
        this.includeControlsInMap();
        this.includeDefaultLayersInMap();
        this.updateBaseLayer();
        this.fitToBounds();
    }

    componentDidUpdate(prevProps) {
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
        map.whenReady(() => {
            // only call if base layer changed
            if (hasChanged(prevProps, this.props, 'baseLayer')) {
                this.updateBaseLayer();
            }

            if (hasChanged(prevProps, this.props, 'coordination')) {
                this.updateCoordination(MapDatas(this.props.coordination));
            }

            if (hasChanged(prevProps, this.props, 'currentArea')) {
                this.updateCoordination(this.props.coordination);
            }
        });
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }


    onEachAsFeature(feature, layer) {
        layer.bindTooltip(`${feature.properties.name} ${feature.properties.workzone ? `- ${feature.properties.workzone}` : ''}`);
        layer.setStyle({
            strokeWidth: 2,
        });
        layer.on('click', () => {
            this.props.selectAs(feature.properties);
        });
        layer.on('mouseover', () => {
            if (feature.properties.workzoneId) {
                d3.selectAll(`.workzone-${feature.properties.workzoneId}`)
                    .attr('fill', polygonsColor.workzone);
            }
            layer.setStyle({
                fillOpacity: 0.5,
            });
        });
        layer.on('mouseout', () => {
            let fillColor = polygonsColor.notAssigned;
            if (layer.feature.properties.workZoneIsNotFull === true) {
                fillColor = polygonsColor.notFull;
            }
            if (layer.feature.properties.workZoneIsNotFull === false) {
                fillColor = polygonsColor.full;
            }
            d3.selectAll(`.workzone-${feature.properties.workzoneId}`)
                .attr('fill', fillColor);
            layer.setStyle({
                fillOpacity: this.props.currentArea && layer.feature.properties.pk === this.props.currentArea.pk ? 0.5 : 0.2,
            });
        });
        if (this.props.currentArea && (layer.feature.properties.pk === this.props.currentArea.pk)) {
            layer.setStyle({
                fillOpacity: 0.5,
            });
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
        //
        // include relevant and constant layers
        //
        const { map } = this;
        const { layers } = this.state;
        this.coordinationGroup = new L.FeatureGroup();
        map.addLayer(this.coordinationGroup);
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
                this.addLayerEvents(layer, feature.properties);
            },
        });

        // at which zoom can be displayed in map
        const zooms = {
            province: -1, // always in map
            zone: 7,
            area: 9,
        };


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
                this.props.getShape(type)
                    .then((response) => {
                        const shape = shapes[type];
                        const data = topojson.feature(response, response.objects[`${type}s`]);
                        data.features.forEach(geoUtils.extendBasic);
                        const minZoomTemp = zooms[type];
                        shape.addLayer(L.geoJson(data, shapeOptions(type)));
                        plotOrHideLayer(minZoomTemp, type);
                    });
            }
        };


        const shape = shapes.province;
        const data = geoUtils.data.province;
        const minZoom = zooms.province;

        shape.addLayer(L.geoJson(data, shapeOptions('province')));
        if (minZoom < 0) {
            // province divisions are always visible and are use as default bounds
            map.addLayer(shape);
            this.state.defaultBounds = shape.getBounds();
        }

        L.DomEvent.on(map, 'zoomend', () => {
            // plotOrHideLayer(zooms.zone, 'zone');
            // plotOrHideLayer(zooms.area, 'area');
        });
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */

    updateBaseLayer() {
        const { baseLayer } = this.props;
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


    updateCoordination(coordination) {
        this.coordinationGroup.clearLayers();
        const areas = L.geoJSON(coordination.current.areas, {
            style(feature) {
                const tempStyle = {
                    color: polygonsColor.notAssigned,
                    opacity: 0.5,
                    className: `workzone-${feature.properties.workzoneId}`,
                };
                if (feature.properties.workzoneId) {
                    tempStyle.color = feature.properties.workZoneIsNotFull ? polygonsColor.notFull : polygonsColor.full;
                }
                return tempStyle;
            },
            onEachFeature: (feature, layer) => {
                this.onEachAsFeature(feature, layer);
            },
        });
        areas.addTo(this.coordinationGroup);
        this.fitToBounds();
    }

    updateTooltipSmall(item) {
        if (item) {
            this.state.containers.tooltipSmall.innerHTML = item.label;
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
            const bounds = this.coordinationGroup.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom: MAX_ZOOM, padding: [25, 25] });
            }
            map.invalidateSize();
        }, 1);
    }

    /*
***************************************************************************
* HELPERS
*************************************************************************** */

    addLayerEvents(layer, item) {
        // layer.bindTooltip(item.label, {sticky: true})
        layer.on({
            click: (event) => {
                L.DomEvent.stop(event);
            },
            contextmenu: (event) => {
                L.DomEvent.stop(event);
            },
            mouseover: (event) => {
                L.DomEvent.stop(event);
                this.updateTooltipSmall(item);
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
MacroMap.defaultProps = {
    coordination: {},
    currentArea: null,
};

MacroMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    coordination: PropTypes.object,
    currentArea: PropTypes.object,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
    selectAs: PropTypes.func.isRequired,
};

export default injectIntl(MacroMap);
