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
import * as zoomBar from './leaflet/zoom-bar';

import {
    updateBaseLayer,
    MESSAGES,
    onResizeMap,
    defaultFitToBound,
    includeControlsInMap,
    genericMap,
    includeDefaultLayersInMap,
} from '../utils/mapUtils';

let exportControl;

class VillageMap extends Component {
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Liste Villages');
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
            villages.forEach((village) => {
                if (village.latitude && village.longitude) {
                    const color = this.props.isRed(village) ? 'red' : 'green';
                    const villageCircle = L.circle([village.latitude, village.longitude], {
                        color,
                        fillColor: color,
                        fillOpacity: 0.2,
                        radius: 500,
                        pane: 'custom-pane-markers',
                    });
                    villageCircle.addTo(this.villageGroup)
                        .on('click', (event) => {
                            const popUp = event.target.getPopup();
                            popUp.setContent(this.props.renderVillagePopUp(village, this.props.intl.formatMessage));
                        })
                        .on('mouseover', () => {
                            this.updateTooltipSmall(village);
                        })
                        .on('mouseout', () => {
                            this.updateTooltipSmall();
                        })
                        .bindPopup();


                    const villageLabel = L.tooltip({
                        permanent: true,
                        direction: 'right',
                        className: 'text see-trough',
                    });
                    villageLabel.setLatLng([village.latitude, village.longitude + 0.0045])
                        .setContent(this.props.renderVillageLabel(village, this.props.intl.formatMessage))
                        .addTo(this.villageGroup);
                }
            });
            this.fitToBounds();
        }
    }

    updateTooltipSmall(item) {
        if (item) {
            this.state.containers.tooltipSmall.innerHTML = item.label ? item.label : item.name;
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
VillageMap.defaultProps = {
    villages: [],
    renderVillagePopUp: () => {},
    renderVillageLabel: () => {},
    isRed: () => false,
};

VillageMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    villages: PropTypes.array,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
    renderVillagePopUp: PropTypes.func,
    renderVillageLabel: PropTypes.func,
    isRed: PropTypes.func,
};

export default injectIntl(VillageMap);
