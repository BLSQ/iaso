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
import * as zoomBar from '../../Plannings/components/leaflet/zoom-bar';
import VillageTypesConstant from '../../../utils/constants/VillageTypesConstant';

import {
    updateBaseLayer,
    MESSAGES,
    onResizeMap,
    defaultFitToBound,
    includeControlsInMap,
    genericMap,
    includeDefaultLayersInMap,
} from '../../../utils/mapUtils';


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
            containers: {},
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map, true);
        this.villageGroup = new L.FeatureGroup();
        this.map.addLayer(this.villageGroup);
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

            if (hasChanged(prevProps, this.props, 'villages') || hasChanged(prevProps, this.props, 'selectedVillageId')) {
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Locator');
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
        map.createPane('custom-pane-selected');
        this.map = map;
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */

    updateVillages() {
        const { villages } = this.props;
        this.villageGroup.clearLayers();
        if (villages) {
            villages.map((village) => {
                let color = 'blue';
                if (this.props.selectedVillageId && (village.id === this.props.selectedVillageId)) {
                    color = '#FF3824';
                } else {
                    Object.entries(VillageTypesConstant).map((villageType) => {
                        if (villageType[1].key === village.village_official) {
                            const colorTemp = villageType[1].color;
                            color = colorTemp;
                        }
                        return true;
                    });
                }
                const villageCircle = L.circle([village.latitude, village.longitude], {
                    color,
                    fillColor: color,
                    fillOpacity: 0.5,
                    radius: 500,
                    pane: 'custom-pane-markers',
                })
                    .addTo(this.villageGroup)
                    .on('click', () => {
                        this.props.selectVillage(village.id);
                    })
                    .on('mouseover', () => {
                        const lat = village.latitude;
                        const lng = village.longitude;
                        this.updateTooltipSmall(village, lat, lng);
                    })
                    .on('mouseout', () => {
                        this.updateTooltipSmall();
                    });

                return true;
            });
            this.fitToBounds();
        }
    }

    updateTooltipSmall(item, lat, lng) {
        if (item) {
            this.state.containers.tooltipSmall.innerHTML = `${item.label ? item.label : item.name}${lat ? `, Lat: ${parseFloat(lat).toFixed(4)}` : ''}${lng ? `, Long: ${parseFloat(lng).toFixed(4)}` : ''}`;
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
        defaultFitToBound(map, this.villageGroup.getBounds(), 13);
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
            mousemove: (event) => {
                L.DomEvent.stop(event);
                this.updateTooltipSmall(item, event.latlng.lat, event.latlng.lng);
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
Map.defaultProps = {
    selectedVillageId: null,
    villages: {},
};

Map.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    villages: PropTypes.array,
    intl: intlShape.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectedVillageId: PropTypes.number,
    getShape: PropTypes.func.isRequired,
};

export default injectIntl(Map);
