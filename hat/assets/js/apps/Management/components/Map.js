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
import moment from 'moment';
import * as zoomBar from '../../../components/leaflet/zoom-bar';

import {
    updateBaseLayer,
    MESSAGES,
    onResizeMap,
    defaultFitToBound,
    includeControlsInMap,
    genericMap,
    includeDefaultLayersInMap,
} from '../../../utils//map/mapUtils';

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
            villages.map((village, index) => {
                let color = 'blue';
                if (village.original.positive_confirmation_test_count > 0) {
                    color = '#FF3824';
                } else {
                    color = '#22955A';
                }
                const villageCircle = L.circle([village.latitude, village.longitude], {
                    color,
                    fillColor: color,
                    fillOpacity: 0.2,
                    radius: 500,
                    pane: 'custom-pane-markers',
                })
                    .addTo(this.villageGroup)
                    .on('click', (event) => {
                        const popUp = event.target.getPopup();
                        popUp.setContent(this.renderVillagesPopup(village));
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
                })
                    .setLatLng([village.latitude, village.longitude + 0.003])
                    .setContent(`${index + 1} - ${village.name}`)
                    .addTo(this.villageGroup);
                return true;
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

    renderVillagesPopup(village) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <div>
                        ${formatMessage({ defaultMessage: 'Nom', id: 'main.label.name' })}:
                        <span>${village.name}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Jours', id: 'main.label.days' })}:
                        <span>${moment(village.original.first_test_date).format('DD-MM-YYYY')} - ${moment(village.original.last_test_date).format('DD-MM-YYYY')}</span>
                    </div>

                    <table>
                        <tbody>
                            <tr><td>CATT</td><td>${village.original.catt_count}</td></tr>
                            <tr><td>RDT</td><td>${village.original.rdt_count}</td></tr>
                            <tr><td>PG</td><td>${village.original.pg_count}</td></tr>
                            <tr><td>MAECT</td><td>${village.original.maect_count}</td></tr>
                            <tr><td>PL</td><td>${village.original.pl_count}</td></tr>
                            <tr><td>Total</td><td>${village.original.test_count}</td></tr>
                        </tbody>
                    </table>
                </section>`;
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
