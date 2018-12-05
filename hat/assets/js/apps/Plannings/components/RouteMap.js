/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';
import geoUtils from '../../Plannings/utils/geo';
import * as zoomBar from '../../Plannings/components/leaflet/zoom-bar';
import { getMonthName } from '../utils/routeUtils';

import {
    MESSAGES,
    onResizeMap,
    defaultFitToBound,
    updateBaseLayer,
    includeControlsInMap,
} from '../../../utils/mapUtils';


let exportControl;
class RouteMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoadingShape: {
                province: false,
                zone: false,
                area: false,
            },
            containers: {},
            layers: {
                villages: new L.FeatureGroup(),
            },
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map);
        this.includeDefaultLayersInMap();
        updateBaseLayer(this.map, this.props.baseLayer);
        this.fitToBounds();
    }

    componentDidUpdate(prevProps) {
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);

        map.whenReady(() => {
            // only call if base layer changed
            if (hasChanged(prevProps, this.props, 'baseLayer')) {
                updateBaseLayer(this.map, this.props.baseLayer);
            }

            if (hasChanged(prevProps, this.props, 'villages')) {
                this.updateVillages();
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Itinéraires');
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

    includeDefaultLayersInMap() {
        //
        // include relevant and constant layers
        //
        const { map } = this;
        const { layers } = this.state;
        this.villageGroup = new L.FeatureGroup();
        map.addLayer(this.villageGroup);
        this.unselectedVillageGroup = new L.FeatureGroup();
        map.addLayer(this.unselectedVillageGroup);
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

        L.DomEvent.on(map, 'zoomend', () => {
            plotOrHideLayer(zooms.zone, 'zone');
            plotOrHideLayer(zooms.area, 'area');
        });
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */

    updateVillages() {
        const { villages, notSelectedVillages } = this.props;
        this.villageGroup.clearLayers();
        this.unselectedVillageGroup.clearLayers();
        if (villages) {
            let previousVillage = null;
            villages.map((village, index) => {
                const villageCircle = L.circle([village.latitude, village.longitude], {
                    radius: 500,
                    pane: 'custom-pane-markers',
                    className: `routeCircle selected-villages ${village.case_count > 0 ? 'with-cases' : ''}`,
                })
                    .bindTooltip(`${index + 1}`, { permanent: true });
                villageCircle.addTo(this.villageGroup);

                if (previousVillage) {
                    const villageA = new L.LatLng(previousVillage.latitude, previousVillage.longitude);
                    const villageB = new L.LatLng(village.latitude, village.longitude);
                    const pointList = [villageA, villageB];
                    const distance = `${(villageB.distanceTo(villageA) / 1000).toFixed(2).toString()}km`;
                    const polyLine = new L.Polyline(pointList, {
                        smoothFactor: 10,
                        className: 'routeLine',
                    })
                        .bindTooltip(distance);
                    polyLine
                        .addTo(this.villageGroup);
                }
                previousVillage = village;
                return true;
            });

            this.fitToBounds();
        }
        if (notSelectedVillages) {
            notSelectedVillages.map((village) => {
                const villageCircle = L.circle([village.latitude, village.longitude], {
                    radius: 500,
                    pane: 'custom-pane-markers',
                    className: `routeCircle not-selected-villages ${village.case_count > 0 ? 'with-cases' : ''}`,
                })
                    .bindTooltip(`${village.village_name} - ${getMonthName(village.month)}`);
                villageCircle.addTo(this.unselectedVillageGroup);
                return true;
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
        const bounds = this.villageGroup.getBounds();
        bounds.extend(this.unselectedVillageGroup.getBounds());
        defaultFitToBound(map, bounds, 13);
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

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <ReactResizeDetector handleWidth handleHeight onResize={(width, height) => this.onResize(width, height)}>
                <section className="map-parent-container">
                    <div ref={(node) => { this.mapNode = node; }} className="map-container" />
                    {
                        (this.state.isLoadingShape.province || this.state.isLoadingShape.zone || this.state.isLoadingShape.area) &&
                        <span className="loading-small" title={formatMessage(MESSAGES['shape-loader'])} />
                    }
                </section>
            </ReactResizeDetector>
        );
    }
}
RouteMap.defaultProps = {
    villages: [],
    notSelectedVillages: [],
};

RouteMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    villages: PropTypes.array,
    notSelectedVillages: PropTypes.array,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
};

export default injectIntl(RouteMap);
