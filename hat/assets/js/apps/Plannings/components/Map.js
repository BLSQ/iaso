/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';
import { FormattedMessage, IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';

import L from 'leaflet';
import * as zoomBar from './leaflet/zoom-bar' // eslint-disable-line

import geoUtils from '../utils/geo';
import MapTooltip from './MapTooltip';

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

const radius = 400;

const MESSAGES = defineMessages({
    'fit-to-bounds': {
        defaultMessage: 'Center to relevant villages',
        id: 'microplanning.label.fitToBounds',
    },
    'box-zoom-title': {
        defaultMessage: 'Draw a square on the map to zoom in to an area',
        id: 'microplanning.label.zoom.box',
    },
    'info-zoom-title': {
        defaultMessage: 'Current zoom level',
        id: 'microplanning.label.zoom.info',
    },
    'shape-loader': {
        defaultMessage: 'Chargement des délimitations',
        id: 'main.label.shape-loader',
    },
});

const getChoosenMarkerRadius = (map) => {
    const currentZoom = map.getZoom();
    const zoomMaxLevel = 13;
    const ratio = currentZoom < 8 ? 1.8 : 1;
    const newRadius = (zoomMaxLevel - currentZoom) <= 1 ? (radius + 50) : (radius + 100) * (zoomMaxLevel - currentZoom) * ratio;
    return newRadius;
};

let exportControl;
class Map extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoadingShape: {
                province: false,
                zone: false,
                area: false,
            },
            map: null, // this is the leaflet object that represents the map
            containers: {},
            overlays: {},

            layers: {
                // where to plot the selected markers
                selectedGroup: new L.FeatureGroup(),
                highlightBufferGroup: new L.FeatureGroup(),
                chosenMarker: null, // marker used to bold the chosen item

                // where to plot ALL villages
                // split in different groups based on type and use
                markersGroups: {
                    group: new L.FeatureGroup(),
                    YES: new L.FeatureGroup(),
                    NO: new L.FeatureGroup(),
                    OTHER: new L.FeatureGroup(),
                    NA: new L.FeatureGroup(),
                },

                shadowsGroups: {
                    group: new L.FeatureGroup(),
                    YES: new L.FeatureGroup(),
                    NO: new L.FeatureGroup(),
                    OTHER: new L.FeatureGroup(),
                    NA: new L.FeatureGroup(),
                },
            },
        };
    }

    componentDidMount() {
        this.createMap();
        this.includeControlsInMap();
        this.includeDefaultLayersInMap();
        this.updateBaseLayer();
        this.updateOverlays();
        this.fitToBounds();

        // return map object to parent
        // (it's needed to execute some leaflet operations)
        this.props.leafletMap(this.state.map);
    }

    componentDidUpdate(prevProps, prevState) {
        const { map } = this.state;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
        const sameVillage = (a, b) => geoUtils.areEqual(a, b, ['id', 'nr_positive_cases']);
        const containSameItems = (prev, curr, key) => {
            if (!hasChanged(prev, curr, key)) return true;
            const arr1 = prev[key];
            const arr2 = curr[key];
            const { length } = arr1;
            if (length !== arr2.length) return false;
            for (let i = 0; i < length; i += 1) {
                if (!sameVillage(arr1[i], arr2[i])) {
                    return false;
                }
            }
            return true;
        };

        map.whenReady(() => {
            // only call if base layer changed
            if (hasChanged(prevProps, this.props, 'baseLayer')) {
                this.updateBaseLayer();
            }

            // only call if one of the overlays changed
            if (hasChanged(prevProps, this.props, 'overlays')) {
                this.updateOverlays();
            }


            // only call if legend or items changed
            if (!containSameItems(prevProps, this.props, 'items') ||
            !containSameItems(prevProps, this.props, 'selectedItems') ||
            hasChanged(prevProps, this.props, 'assignationsMap')
            ) {
                this.updateItems(true);
            } else if (hasChanged(prevProps, this.props, 'legend')) {
                this.updateItems();
            }

            // only call if the number of selected items changed
            if (!containSameItems(prevProps, this.props, 'selectedItems')) {
                this.updateSelectedItems();
            }

            // only call if fullscreen option changed
            if (hasChanged(prevProps, this.props, 'fullscreen')) {
                this.updateFullscreenMode();
            }

            // show/hide tooltip
            if (hasChanged(prevProps, this.props, 'chosenItem')) {
                this.updateTooltipLarge();
            }
            this.updateHighlightBuffer();
        });
    }

    componentWillUnmount() {
        if (this.state.map) {
            this.state.map.remove();
        }
    }
    onResize(width, height) {
        const { map } = this.state;
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
            filename: 'Microplanning',
        }).addTo(map);
    }

    /* ***************************************************************************
   * CREATE MAP
   *************************************************************************** */

    createMap() {
        const map = L.map(this.state.containers.map, {
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
        map.createPane('custom-pane-highlight-buffer');
        map.createPane('custom-pane-shadows');
        map.createPane('custom-pane-markers');
        map.createPane('custom-pane-highlight');
        map.createPane('custom-pane-selected');
        map.createPane('custom-pane-chosen');
        map.createPane('custom-pane-buffer');

        this.state.map = map;
    }

    includeControlsInMap() {
        // The order in which the controls are added matters
        const { formatMessage } = this.props.intl;
        const { map, containers } = this.state;

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

        const tooltipLargeControl = L.control({ position: 'bottomleft' });
        tooltipLargeControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
        tooltipLargeControl.addTo(map);

        containers.tooltipLarge = tooltipLargeControl.getContainer();
    }

    resizeChoosenMarker() {
        const { map } = this.state;
        const { chosenMarker } = this.state.layers;
        if (map.hasLayer(chosenMarker)) {
            chosenMarker.setRadius(getChoosenMarkerRadius(map));
        }
    }

    includeDefaultLayersInMap() {
        //
        // include relevant and constant layers
        //

        const { map, layers } = this.state;
        map.addLayer(layers.selectedGroup);
        map.addLayer(layers.markersGroups.group);
        map.addLayer(layers.shadowsGroups.group);
        map.addLayer(layers.highlightBufferGroup);

        //
        // plot the ALL boundaries
        //

        const shapes = {
            province: new L.FeatureGroup(),
        };

        // at which zoom can be displayed in map
        const zooms = {
            province: -1, // always in map
            zone: 7,
            area: 9,
        };
        const shapeOptions = type => ({
            pane: 'custom-pane-shapes',
            style: () => ({ className: String.raw`map-layer ${type}` }),
            onEachFeature: (feature, layer) => {
                this.addLayerEvents(layer, feature.properties);
            },
        });

        // create marker for the chosen item
        const chosenMarker = L.circle(map.getCenter(), {
            className: 'map-marker chosen',
            pane: 'custom-pane-chosen',
            radius: 0,
        });
        layers.chosenMarker = chosenMarker;

        geoUtils.getShape('province', this, shapes, shapeOptions, zooms, map).then((shape) => {
            this.state.defaultBounds = shape.getBounds();
        });
        map.addLayer(chosenMarker);


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
                geoUtils.getShape(type, this, shapes, shapeOptions, zooms, map).then((minZoomTemp) => {
                    plotOrHideLayer(minZoomTemp, type);
                });
            }
        };
        L.DomEvent.on(map, 'zoomend', (event) => {
            plotOrHideLayer(zooms.zone, 'zone');
            plotOrHideLayer(zooms.area, 'area');
            this.resizeChoosenMarker();
        });
    }

    /* ***************************************************************************
   * UPDATE STATE
   *************************************************************************** */

    updateBaseLayer() {
        const { baseLayer } = this.props;
        const { map } = this.state;

        Object.keys(BASE_LAYERS).forEach((key) => {
            const layer = BASE_LAYERS[key];
            if (key === baseLayer) {
                layer.addTo(map);
            } else if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
    }

    updateOverlays() {
        const { map } = this.state;

        Object.keys(this.props.overlays).forEach((key) => {
            const active = this.props.overlays[key];
            const layer = this.state.overlays[key];
            if (active && !map.hasLayer(layer)) {
                layer.addTo(map);
            } else if (!active && map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
    }

    updateItems(force) {
        const { legend, items, assignationsMap } = this.props;
        const { layers } = this.state;
        const { markersGroups, shadowsGroups } = layers;

        // plot indicated villages (active in legend)
        Object.keys(legend).forEach((key) => {
            const markers = markersGroups[key];
            const shadows = shadowsGroups[key];
            if (force) {
                markers.clearLayers();
                shadows.clearLayers();
            }
            if (legend[key]) {
                // include layers in group
                if (!markersGroups.group.hasLayer(markers)) {
                    markersGroups.group.addLayer(markers);
                    shadowsGroups.group.addLayer(shadows);
                }

                // this.fitToBounds();
                // check if the layer has markers
                if (markers.getLayers().length === 0) {
                    items
                        .forEach((item) => {
                            const teamId = assignationsMap[`${item.id}`];
                            let className;

                            className = String.raw`map-marker ${item._class}`;
                            if (teamId) {
                                if (parseInt(teamId, 10) === parseInt(this.props.teamId, 10)) {
                                    className += ' assignedToCurrentTeam';
                                } else {
                                    className += ' assignedToOtherTeam';
                                }
                            }

                            const options = {
                                className,
                                pane: String.raw`custom-pane-${item._pane}`,
                                radius,
                            };

                            const marker = L.circle(item._latlon, options);
                            this.addLayerEvents(marker, item);
                            markers.addLayer(marker);
                        });
                }
            } else if (markersGroups.group.hasLayer(markers)) {
                // remove layers from group
                markersGroups.group.removeLayer(markers);
                shadowsGroups.group.removeLayer(shadows);
            }
        });
    }

    updateSelectedItems() {
        const { selectedItems } = this.props;
        const { selectedGroup } = this.state.layers;

        selectedGroup.clearLayers();

        selectedItems.forEach((item) => {
            const options = {
                className: 'map-marker selected',
                pane: 'custom-pane-selected',
                radius,
            };

            const marker = L.circle(item._latlon, options);
            this.addLayerEvents(marker, { ...item, selected: true });
            selectedGroup.addLayer(marker);
        });
    }

    updateHighlightBuffer() {
        const { legend, highlightBufferSize } = this.props;
        const { highlightBufferGroup } = this.state.layers;

        highlightBufferGroup.clearLayers();
        const bufferSize = highlightBufferSize * 1000;
        // include buffer zone
        if (highlightBufferSize > 0) {
            const { items } = this.props;

            const highlight = items.filter(item =>
                legend[item.village_official] && item._isHighlight);

            highlight.forEach((item) => {
                const options = {
                    className: 'map-marker highlight-buffer',
                    pane: 'custom-pane-highlight-buffer',
                    radius: radius + bufferSize,
                };

                const marker = L.circle(item._latlon, options);
                highlightBufferGroup.addLayer(marker);
            });
        }
    }

    updateFullscreenMode() {
        const { fullscreen } = this.props;
        const { map } = this.state;
        const { warning } = this.state.containers;

        warning.innerHTML = '';
        if (fullscreen) {
            const printButton = (
                <div
                    className="map__control__button--printer"
                    onClick={() => window.print()}
                    tabIndex={0}
                    role="button"
                >
                    <i className="map__icon--printer" />
                    <span className="text--center">
                        <FormattedMessage id="microplanning.label.print.info" defaultMessage="Hit here or press «Ctrl+P» to print the map." />
                        <br />
                        <FormattedMessage id="microplanning.label.print.esc" defaultMessage="Press «Esc» to return to normal view." />
                    </span>
                </div>
            );
            ReactDOM.render(this.injectI18n(printButton), warning);
        }

        // resize map
        map.invalidateSize();
    }

    updateTooltipSmall(item) {
        if (!this.props.chosenItem && item) {
            this.state.containers.tooltipSmall.innerHTML = item.label ? item.label : item.name;
        } else {
            this.state.containers.tooltipSmall.innerHTML = '';
        }
    }

    closeTooltipLarge() {
        const { tooltipLarge } = this.state.containers;
        this.props.showItem(null);
        ReactDOM.unmountComponentAtNode(tooltipLarge);
    }


    updateTooltipLarge() {
        const { map } = this.state;
        const { tooltipSmall, tooltipLarge } = this.state.containers;
        const { chosenMarker } = this.state.layers;
        const {
            chosenItem, legend, items,
        } = this.props;
        // clean previous
        if (map.hasLayer(chosenMarker)) {
            chosenMarker.setRadius(0);
            map.removeLayer(chosenMarker);
        }
        if (!chosenItem) {
            return;
        }
        const item = (!chosenItem.name
            ? geoUtils.extendDivisionInfo(chosenItem, items, legend)
            : chosenItem
        );

        if (item._latlon) {
            map.addLayer(chosenMarker);
            chosenMarker.setRadius(getChoosenMarkerRadius(map));
            chosenMarker.setLatLng(item._latlon);
            map.panTo(item._latlon);
        }

        const tootltip = (
            <div>
                <div
                    tabIndex={0}
                    role="button"
                    onClick={() => this.closeTooltipLarge()}
                    className="map__tooltip--close"
                >
                    <FormattedMessage id="microplanning.label.close" defaultMessage="close" />&nbsp;
                    <i className="fa fa-close" />
                </div>
                <MapTooltip
                    item={item}
                    teamId={this.props.teamId}
                    teams={this.props.teams}
                    areas={this.props.areas}
                    planningId={this.props.planningId}
                    assignations={this.props.assignations}
                    selectItems={(itemList, activateSaveButton) => this.props.selectItems(itemList, activateSaveButton)}
                />
            </div>
        );
        ReactDOM.render(this.injectI18n(tootltip), tooltipLarge);
        tooltipSmall.innerHTML = '';
    }

    /* ***************************************************************************
   * ACTIONS
   *************************************************************************** */

    fitToBounds() {
        const { map, layers, defaultBounds } = this.state;
        const { selectedGroup, shadowsGroups, markersGroups } = layers;
        // maximum zoom allowed to fit to relevant markers
        const MAX_ZOOM = 13;

        //
        // relevant order:
        //
        // 1. selected markers
        // 2. highlighted shadows
        // 3. official villages
        // 4. default bounds (provinces shape)
        // 5. default center and zoom
        //

        setTimeout(() => {
            if (selectedGroup.getBounds().isValid()) {
                map.fitBounds(selectedGroup.getBounds(), { maxZoom: MAX_ZOOM });
            } else if (shadowsGroups.group.getBounds().isValid()) {
                map.fitBounds(shadowsGroups.group.getBounds(), { maxZoom: MAX_ZOOM });
            } else if (markersGroups.group.hasLayer(markersGroups.YES) &&
markersGroups.YES.getBounds().isValid()) {
                map.fitBounds(markersGroups.YES.getBounds(), { maxZoom: MAX_ZOOM });
            } else if (defaultBounds) {
                map.fitBounds(defaultBounds, { maxZoom: MAX_ZOOM });
            } else {
                map.setView(geoUtils.center, geoUtils.zoom);
            }
            map.invalidateSize();
        }, 1);
    }

    /* ***************************************************************************
   * HELPERS
   *************************************************************************** */

    addLayerEvents(layer, item) {
        // layer.bindTooltip(item.label, {sticky: true})
        layer.on({
            click: (event) => {
                L.DomEvent.stop(event);
                this.props.showItem(item);
            },
            contextmenu: (event) => {
                L.DomEvent.stop(event);
                this.props.showItem(item);
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
        const { formatMessage } = this.props.intl;
        return (
            <ReactResizeDetector handleWidth handleHeight onResize={(width, height) => this.onResize(width, height)}>
                <section className="map-parent-container">
                    <div ref={(node) => { this.state.containers.map = node; }} className="map-container" />
                    {
                        (this.state.isLoadingShape.province || this.state.isLoadingShape.zone || this.state.isLoadingShape.area) &&
                        <span className="loading-small" title={formatMessage(MESSAGES['shape-loader'])} />
                    }
                </section>
            </ReactResizeDetector>
        );
    }
}
Map.defaultProps = {
    planningId: '',
    baseLayer: '',
    overlays: undefined,
    legend: undefined,
    fullscreen: false,
    items: [],
    selectedItems: [],
    highlightBufferSize: PropTypes.number0,
    chosenItem: undefined,
    areas: undefined,
    teams: [],
    assignationsMap: undefined,
    assignations: [],
    teamId: '',
};

Map.propTypes = {
    baseLayer: PropTypes.string,
    overlays: PropTypes.object,
    legend: PropTypes.object,
    fullscreen: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.object),
    selectedItems: PropTypes.arrayOf(PropTypes.object),
    highlightBufferSize: PropTypes.number,
    chosenItem: PropTypes.object,
    showItem: PropTypes.func.isRequired,
    leafletMap: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    teams: PropTypes.arrayOf(PropTypes.object),
    assignationsMap: PropTypes.object,
    assignations: PropTypes.array,
    teamId: PropTypes.string,
    getShape: PropTypes.func.isRequired,
    areas: PropTypes.object,
    planningId: PropTypes.string,
    selectItems: PropTypes.func.isRequired,
};

export default injectIntl(Map);
