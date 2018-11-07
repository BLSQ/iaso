/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';
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
let exportControl;

const MapDatas = (coordination, workzones) => {
    const tempCoordinations = coordination;
    const tempAreas = [];
    coordination.areas.features.map((area) => {
        const tempArea = clone(area);
        delete tempArea.properties.workzoneId;
        delete tempArea.properties.workzone;
        delete tempArea.properties.workzoneColor;
        tempArea.properties.zsName = getZsName(tempArea.properties.ZS, coordination.zones.features);
        let pop = coordination.endemic_as_populations[tempArea.properties.pk];
        if (!pop) {
            pop = 0;
        }
        tempArea.properties.population = pop;
        workzones.map((workzone) => {
            workzone.as_list.map((workingArea) => {
                if (parseInt(tempArea.properties.pk, 10) === workingArea.id) {
                    tempArea.properties.workzoneId = workzone.id;
                    tempArea.properties.workzone = workzone.name;
                    tempArea.properties.workzoneColor = workzone.color ? workzone.color : null;
                }
                return null;
            });
            return null;
        });
        tempAreas.push(tempArea);
        return null;
    });
    tempCoordinations.areas.features = tempAreas;
    return tempCoordinations;
};

class GeoScopeMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            isFirstLoad: true,
            layers: {
                villages: new L.FeatureGroup(),
            },
        };
    }

    componentDidMount() {
        this.createMap();
        this.includeControlsInMap();
        this.includeDefaultLayersInMap();
        this.updateBaseLayer(this.props.baseLayer);
        this.fitToBounds();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.coordinationId !== this.props.coordinationId) {
            this.setState({
                isFirstLoad: true,
            });
        }
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
        map.whenReady(() => {
            console.log('map ready');
            // only call if base layer changed
            if (hasChanged(nextProps, this.props, 'baseLayer')) {
                this.updateBaseLayer(nextProps.baseLayer);
            }
            if (hasChanged(nextProps, this.props, 'coordination') || hasChanged(nextProps, this.props, 'workzones')) {
                // this.updateCoordination(MapDatas(nextProps.coordination, nextProps.workzones));
            }
            if (hasChanged(nextProps, this.props, 'currentArea')) {
                this.updateCoordination(nextProps.coordination, nextProps.workzones);
            }
        });
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    onResize(width, height) {
        const { map } = this;
        const cutomSize = {
            width,
            height,
            className: 'A4Landscape page',
            tooltip: 'PNG',
        };
        if (exportControl) {
            map.removeControl(exportControl);
        }
        exportControl = L.easyPrint({
            position: 'topleft',
            sizeModes: [cutomSize],
            hideControlContainer: true,
            title: 'Télécharger',
            exportOnly: true,
            filename: 'Macro planning',
        }).addTo(map);
    }


    onEachAsFeature(feature, layer) {
        layer.bindTooltip(`AS: ${feature.properties.name}${` - pop. vil. endém.: ${feature.properties.population}`}`);
        layer.setStyle({
            fillOpacity: 0.5,
        });
        layer.on('click', () => {
            this.props.selectAs(feature.properties);
        });
        layer.on('mouseover', () => {
            this.updateTooltipSmall({ label: `ZS: ${feature.properties.zsName}${feature.properties.workzone ? ` -  RA: ${feature.properties.workzone}` : ''}` });
            layer.setStyle({
                fillOpacity: 0.8,
            });
        });
        layer.on('mouseout', () => {
            this.updateTooltipSmall();
            layer.setStyle({
                fillOpacity: 0.5,
            });
        });
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
        this.zonesGroup = new L.FeatureGroup();
        map.addLayer(this.coordinationGroup);
        map.addLayer(this.zonesGroup);
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


        const shape = shapes.province;
        const data = geoUtils.data.province;
        const minZoom = zooms.province;

        shape.addLayer(L.geoJson(data, shapeOptions('province')));
        if (minZoom < 0) {
            // province divisions are always visible and are use as default bounds
            map.addLayer(shape);
            this.state.defaultBounds = shape.getBounds();
        }
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


    updateCoordination(coordination) {
        this.coordinationGroup.clearLayers();
        this.zonesGroup.clearLayers();
        const areas = L.geoJSON(coordination.areas, {
            style(feature) {
                const tempStyle = {
                    color: feature.properties.workzoneId ? feature.properties.workzoneColor : 'gray',
                };
                return tempStyle;
            },
            onEachFeature: (feature, layer) => {
                this.onEachAsFeature(feature, layer);
            },
        });
        areas.addTo(this.coordinationGroup);

        const zones = L.geoJSON(coordination.zones, {
            onEachFeature: (feature, layer) => {
                layer.setStyle({
                    className: 'zone',
                });
            },
        });
        zones.addTo(this.zonesGroup);
        if (this.state.isFirstLoad) {
            this.fitToBounds();
            this.setState({
                isFirstLoad: false,
            });
        }
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
        return (
            <ReactResizeDetector handleWidth handleHeight onResize={(width, height) => this.onResize(width, height)}>
                <section className="map-parent-container">
                    <div ref={(node) => { this.mapNode = node; }} className="map-container" />
                </section>
            </ReactResizeDetector>
        );
    }
}
GeoScopeMap.defaultProps = {
    coordination: {},
    workzones: [],
};

GeoScopeMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    coordination: PropTypes.object,
    workzones: PropTypes.array,
    intl: intlShape.isRequired,
    selectAs: PropTypes.func.isRequired,
    coordinationId: PropTypes.string.isRequired,
};

export default injectIntl(GeoScopeMap);
