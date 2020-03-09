/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';
import {
    FormattedMessage, IntlProvider, injectIntl, intlShape,
} from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';

import L from 'leaflet';
import * as zoomBar from '../../../components/leaflet/zoom-bar';

import geoUtils from '../../../utils/geo';
import MapTooltip from './MapTooltip';
import 'leaflet.markercluster';

import {
    MESSAGES,
    onResizeMap,
    updateBaseLayer,
    includeControlsInMap,
    genericMap,
    includeZoombar,
    zooms,
} from '../../../utils/map/mapUtils';

let theZoomBar;
const radius = 600;

const renderDivIcon = (content, key, size) => L.divIcon({
    html: `<div><span>${content}</span></div>`,
    className: `marker-cluster marker-cluster-${key}`,
    iconSize: L.point(size, size),
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
            layers: {
                // where to plot the selected markers
                selectedGroup: new L.FeatureGroup(),
                highlightBufferGroup: new L.FeatureGroup(),
                chosenMarker: null, // marker used to bold the chosen item
                chosenMarkerCluster: null,

                // where to plot ALL villages
                // split in different groups based on type and use
                markersGroups: {
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
        const { workzoneId, toggleSearchModal } = this.props;
        this.createMap();

        includeControlsInMap(this, this.state.map, true, false, () => null, false);
        theZoomBar = includeZoombar(this.state.map, this, Boolean(workzoneId), () => toggleSearchModal());
        this.includeDefaultLayersInMap();
        updateBaseLayer(this.state.map, this.props.baseLayer);
        this.fitToBounds();

        // return map object to parent
        // (it's needed to execute some leaflet operations)
        this.props.leafletMap(this.state.map);
    }

    componentDidUpdate(prevProps) {
        const { workzoneId, toggleSearchModal } = this.props;
        const { map } = this.state;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
        if (prevProps.workzoneId !== workzoneId) {
            theZoomBar = includeZoombar(this.state.map, this, Boolean(workzoneId), () => toggleSearchModal(), theZoomBar);
        }
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
                updateBaseLayer(this.state.map, this.props.baseLayer);
            }


            // only call if legend or items changed
            if (!containSameItems(prevProps, this.props, 'items')
                || !containSameItems(prevProps, this.props, 'selectedItems')
                || hasChanged(prevProps, this.props, 'assignationsMap'
                    || this.props.withCluster !== prevProps.withCluster)
            ) {
                this.updateItems(true);
            } else if (hasChanged(prevProps, this.props, 'legend')) {
                this.updateItems();
            }

            // only call if fullscreen option changed
            if (hasChanged(prevProps, this.props, 'fullscreen')) {
                this.updateFullscreenMode();
            }
            // show/hide tooltip
            if (hasChanged(prevProps, this.props, 'chosenItem')) {
                this.updateTooltipLarge(this.props.chosenItem);
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Microplanning', 'topright');
    }

    /* ***************************************************************************
   * CREATE MAP
   *************************************************************************** */

    createMap() {
        const map = genericMap(this.state.containers.map);

        // create panes to preserve z-index order
        map.createPane('custom-pane-shapes');
        map.createPane('custom-pane-highlight-buffer');
        map.createPane('custom-pane-markers');
        map.createPane('custom-pane-highlight');
        map.createPane('custom-pane-selected');
        map.createPane('custom-pane-chosen');

        this.state.map = map;
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
        map.addLayer(layers.highlightBufferGroup);

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

        // create marker for the chosen item

        const chosenMarkerCluster = L.marker(
            map.getCenter(),
            { icon: renderDivIcon('', 'chosen', 30) },
        );
        const chosenMarker = L.circle(map.getCenter(), {
            className: 'map-marker chosen',
            pane: 'custom-pane-chosen',
            radius: 0,
        });
        layers.chosenMarker = chosenMarker;
        layers.chosenMarkerCluster = chosenMarkerCluster;

        geoUtils.getShape('province', this, shapes, shapeOptions, zooms, map).then((shape) => {
            this.state.defaultBounds = shape.getBounds();
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
    updateItems(force) {
        const {
            legend,
            items,
            assignationsMap,
            withCluster,
        } = this.props;
        const { layers } = this.state;
        const { markersGroups } = layers;
        const { selectedGroup } = this.state.layers;
        selectedGroup.clearLayers();
        // plot indicated villages (active in legend)
        Object.keys(legend).forEach((key) => {
            const markers = markersGroups[key];
            if (force) {
                markers.clearLayers();
            }
            if (legend[key]) {
                // include layers in group
                if (!markersGroups.group.hasLayer(markers)) {
                    markersGroups.group.addLayer(markers);
                }
                let markersVillages;
                let markersVillagesWithCases;
                if (withCluster) {
                    markersVillages = L.markerClusterGroup({
                        maxClusterRadius: 35,
                        iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages small', 30),
                    });
                    markersVillagesWithCases = L.markerClusterGroup({
                        maxClusterRadius: 35,
                        iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages-with-cases small', 30),
                    });
                }
                // check if the layer has markers
                if (markers.getLayers().length === 0) {
                    items
                        .forEach((item) => {
                            const isEndemic = item._class === 'highlight';
                            let marker;
                            let className = '';
                            let teamId;
                            if (withCluster) {
                                className += isEndemic ? 'villages-with-cases small' : 'villages small';
                                marker = L.marker(
                                    [item.latitude, item.longitude],
                                    { icon: renderDivIcon('', className, 30) },
                                );
                                if (!isEndemic) {
                                    markersVillages.addLayer(marker);
                                } else {
                                    markersVillagesWithCases.addLayer(marker);
                                }
                            } else {
                                teamId = assignationsMap[`${item.id}`];
                                if (teamId) {
                                    if (this.props.teamId) {
                                        if (parseInt(teamId, 10) === parseInt(this.props.teamId, 10)) {
                                            className += 'assignedToCurrentTeam ';
                                        } else {
                                            className += 'assignedToOtherTeam ';
                                        }
                                    } else {
                                        className += 'selected ';
                                    }
                                }
                                className += String.raw`map-marker ${item._class}`;
                                const options = {
                                    className,
                                    pane: String.raw`custom-pane-${item._pane}`,
                                    icon: renderDivIcon('', className, 30),
                                    radius,
                                };
                                marker = L.circle(item._latlon, options);
                                if (teamId) {
                                    selectedGroup.addLayer(marker);
                                } else {
                                    markers.addLayer(marker);
                                }
                            }
                            if (teamId) {
                                this.addLayerEvents(marker, { ...item, selected: true });
                            } else {
                                this.addLayerEvents(marker, item);
                            }
                        });

                    if (withCluster) {
                        markers.addLayer(markersVillagesWithCases);
                        markers.addLayer(markersVillages);
                    }
                }
            } else if (markersGroups.group.hasLayer(markers)) {
                // remove layers from group
                markersGroups.group.removeLayer(markers);
            }
        });
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

    updateHighlightBuffer() {
        const { legend, highlightBufferSize } = this.props;
        const { highlightBufferGroup } = this.state.layers;

        highlightBufferGroup.clearLayers();
        const bufferSize = highlightBufferSize * 1000;
        // include buffer zone
        if (highlightBufferSize > 0) {
            const { items } = this.props;

            const highlight = items.filter(item => legend[item.village_official] && item._isHighlight);

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


    updateTooltipLarge(chosenItem) {
        const { map } = this.state;
        const { tooltipSmall, tooltipLarge } = this.state.containers;
        const { chosenMarker, chosenMarkerCluster } = this.state.layers;
        const { withCluster } = this.props;
        const {
            legend, items,
        } = this.props;
        // clean previous
        if (map.hasLayer(chosenMarker)) {
            chosenMarker.setRadius(0);
            map.removeLayer(chosenMarker);
        }
        if (map.hasLayer(chosenMarkerCluster)) {
            map.removeLayer(chosenMarkerCluster);
        }
        if (!chosenItem) {
            this.closeTooltipLarge();
            return;
        }
        const item = (!chosenItem.name
            ? geoUtils.extendDivisionInfo(chosenItem, items, legend)
            : chosenItem
        );

        if (item._latlon) {
            if (!withCluster) {
                map.addLayer(chosenMarker);
                chosenMarker.setRadius(getChoosenMarkerRadius(map));
                chosenMarker.setLatLng(item._latlon);
            } else {
                map.addLayer(chosenMarkerCluster);
                chosenMarkerCluster.setLatLng(item._latlon);
            }
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
                    <FormattedMessage id="microplanning.label.close" defaultMessage="close" />
                    &nbsp;
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
                    workzoneId={this.props.workzoneId}
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
        const { selectedGroup, markersGroups } = layers;
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
            } else if (markersGroups.group.hasLayer(markersGroups.YES)
                && markersGroups.YES.getBounds().isValid()) {
                map.fitBounds(markersGroups.YES.getBounds(), { maxZoom: MAX_ZOOM });
            } else if (defaultBounds) {
                map.fitBounds(defaultBounds, { maxZoom: MAX_ZOOM });
            } else {
                map.setView(geoUtils.center, geoUtils.zoom);
            }
            map.invalidateSize();
        }, 200);
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
                        (this.state.isLoadingShape.province || this.state.isLoadingShape.zone || this.state.isLoadingShape.area)
                        && <span className="loading-small" title={formatMessage(MESSAGES['shape-loader'])} />
                    }
                </section>
            </ReactResizeDetector>
        );
    }
}

Map.defaultProps = {
    planningId: '',
    baseLayer: '',
    legend: undefined,
    fullscreen: false,
    items: [],
    selectedItems: [],
    highlightBufferSize: 0,
    chosenItem: undefined,
    areas: undefined,
    teams: [],
    assignationsMap: undefined,
    assignations: [],
    teamId: '',
    workzoneId: '',
    withCluster: false,
};

Map.propTypes = {
    baseLayer: PropTypes.string,
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
    workzoneId: PropTypes.string,
    withCluster: PropTypes.bool,
    toggleSearchModal: PropTypes.func.isRequired,
};

export default injectIntl(Map);
