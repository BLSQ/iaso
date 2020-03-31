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
import * as zoomBar from '../../../components/leaflet/zoom-bar';
import { getMonthName } from '../utils/routeUtils';

import {
    MESSAGES,
    onResizeMap,
    defaultFitToBound,
    updateBaseLayer,
    includeControlsInMap,
    genericMap,
    includeDefaultLayersInMap,
} from '../../../utils/map/mapUtils';


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
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map);
        this.villageGroup = new L.FeatureGroup();
        this.map.addLayer(this.villageGroup);
        this.unselectedVillageGroup = new L.FeatureGroup();
        this.map.addLayer(this.unselectedVillageGroup);
        includeDefaultLayersInMap(this);
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
        const map = genericMap(this.mapNode);

        // create panes to preserve z-index order
        map.createPane('custom-pane-shapes');
        map.createPane('custom-pane-markers');
        this.map = map;
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */

    updateVillages() {
        const { villages, notSelectedVillages } = this.props;
        this.villageGroup.clearLayers();
        this.unselectedVillageGroup.clearLayers();
        if (notSelectedVillages) {
            notSelectedVillages.map((village) => {
                const villageCircle = L.circle([village.latitude, village.longitude], {
                    radius: 500,
                    pane: 'custom-pane-markers',
                    className: `routeCircle not-selected-villages ${village.case_count > 0 ? 'with-cases' : ''}`,
                })
                    .bindTooltip(`${village.village_name} - M.${village.month}`);
                villageCircle.addTo(this.unselectedVillageGroup);
                return true;
            });
        }
        if (villages) {
            let previousVillage = null;
            villages.map((village, index) => {
                if (!village.deleted) {
                    const villageCircle = L.circle([village.latitude, village.longitude], {
                        radius: 500,
                        pane: 'custom-pane-markers',
                        className: `routeCircle selected-villages ${village.case_count > 0 ? 'with-cases' : ''}`,
                    })
                        .on('mouseover', () => this.updateTooltipSmall({ name: village.village_name }))
                        .bindTooltip(`${index + 1} - ${village.village_name}`, { permanent: true });
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
                }
                return true;
            });

            this.fitToBounds();
        }
    }

    updateTooltipSmall(item) {
        if (item && item.name) {
            this.state.containers.tooltipSmall.innerHTML = item.name;
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
                        (this.state.isLoadingShape.province || this.state.isLoadingShape.zone || this.state.isLoadingShape.area)
                        && <span className="loading-small" title={formatMessage(MESSAGES['shape-loader'])} />
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
