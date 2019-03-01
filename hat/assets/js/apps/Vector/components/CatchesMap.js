/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';
import {
    renderCatchesPopup,
    renderTrapsPopup,
} from '../utlls/vectorMapUtils';

import {
    MESSAGES,
    onResizeMap,
    genericMap,
    defaultFitToBound,
    includeControlsInMap,
    includeDefaultLayersInMap,
} from '../../../utils/mapUtils';

const tileOptions = { keepBuffer: 4 };
const arcgisPattern = 'https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{z}/{y}/{x}.jpg';
const BASE_LAYERS = {
    blank: L.tileLayer(''),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileOptions),
    'arcgis-street': L.tileLayer(arcgisPattern.replace('{}', 'World_Street_Map'), tileOptions),
    'arcgis-satellite': L.tileLayer(arcgisPattern.replace('{}', 'World_Imagery'), { ...tileOptions, maxZoom: 16 }),
    'arcgis-topo': L.tileLayer(arcgisPattern.replace('{}', 'World_Topo_Map'), { ...tileOptions, maxZoom: 17 }),
};


const updateBaseLayer = (currentMap, baseLayer) => {
    Object.keys(BASE_LAYERS).forEach((key) => {
        const layer = BASE_LAYERS[key];
        if (key === baseLayer) {
            layer.addTo(currentMap);
        } else if (currentMap.hasLayer(layer)) {
            currentMap.removeLayer(layer);
        }
    });
};

const renderDivIcon = (content, key, size) => L.divIcon({
    html: `<div><span>${content}</span></div>`,
    className: `marker-custom marker-${key}`,
    iconSize: L.point(size, size),
});

let exportControl;
class CatchesMap extends Component {
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
        this.catchesGroup = new L.FeatureGroup();
        this.trapGroup = new L.FeatureGroup();
        this.map.addLayer(this.catchesGroup);
        this.map.addLayer(this.trapGroup);
        includeDefaultLayersInMap(this);
        updateBaseLayer(this.map, this.props.baseLayer);
        this.updateCatches();
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
            if (hasChanged(prevProps, this.props, 'trap')) {
                this.updateCatches();
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Catches');
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

    updateCatches() {
        const {
            trap,
            intl: {
                formatMessage,
            },
        } = this.props;
        this.catchesGroup.clearLayers();
        this.trapGroup.clearLayers();
        const trapCircle = L.marker(
            [trap.latitude, trap.longitude],
            { icon: renderDivIcon('', 'sites small', 30) },
        );
        trapCircle.addTo(this.trapGroup)
            .on('click', (event) => {
                const popUp = event.target.getPopup();
                popUp.setContent(renderTrapsPopup(trap, formatMessage, false));
            })
            .bindPopup()
            .on('mouseover', () => {
                const lat = trap.latitude;
                const lng = trap.longitude;
                const item = {
                    label: `${formatMessage(MESSAGES.trap)} ${trap.name} `,
                };
                this.updateTooltipSmall(item, lat, lng);
            })
            .on('mouseout', () => {
                this.updateTooltipSmall();
            });
        if (trap.catches) {
            trap.catches.map((catchItem) => {
                const catchCircle = L.marker(
                    [catchItem.latitude, catchItem.longitude],
                    {
                        icon: renderDivIcon(
                            '',
                            'catches small',
                            30,
                        ),
                    },
                );
                catchCircle.addTo(this.catchesGroup)
                    .on('click', (event) => {
                        const popUp = event.target.getPopup();
                        popUp.setContent(renderCatchesPopup(catchItem, formatMessage));
                    })
                    .bindPopup()
                    .on('mouseover', () => {
                        const lat = catchItem.latitude;
                        const lng = catchItem.longitude;
                        const item = {
                            label: `${formatMessage(MESSAGES.catch)}-${catchItem.id} `,
                        };
                        this.updateTooltipSmall(item, lat, lng);
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
        defaultFitToBound(map, this.catchesGroup.getBounds(), 15);
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

CatchesMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    trap: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    saveTrap: PropTypes.func.isRequired,
    getShape: PropTypes.func.isRequired,
};

export default injectIntl(CatchesMap);
