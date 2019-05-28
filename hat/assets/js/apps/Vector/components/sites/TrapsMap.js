/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';

import { renderSitesPopup } from '../../utlls/vectorMapUtils';

import {
    MESSAGES,
    onResizeMap,
    genericMap,
    defaultFitToBound,
    includeControlsInMap,
    includeDefaultLayersInMap,
} from '../../../../utils/mapUtils';

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
class TrapsMap extends Component {
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
        this.trapsGroup = new L.FeatureGroup();
        this.siteGroup = new L.FeatureGroup();
        this.map.addLayer(this.trapsGroup);
        this.map.addLayer(this.siteGroup);
        includeDefaultLayersInMap(this);
        updateBaseLayer(this.map, this.props.baseLayer);
        this.updateSites();
        this.updateTraps();
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
            if (hasChanged(prevProps, this.props, 'site') || this.props.mapUpdated) {
                if (this.props.mapUpdated) {
                    this.props.setMapUpdate(false);
                }
                this.updateSites();
                this.updateTraps();
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Traps');
    }

    isItemVisible(key) {
        let showItem = false;
        const item = this.props.itemsToShow.find(i => i.key === key);
        if (item && item.isActive) {
            showItem = true;
        }
        return showItem;
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

    updateSites() {
        const {
            site,
            intl: {
                formatMessage,
            },
        } = this.props;
        this.siteGroup.clearLayers();

        if (this.isItemVisible('sites')) {
            const siteCircle = L.marker(
                [site.latitude, site.longitude],
                { icon: renderDivIcon('', 'sites small', 30) },
            );
            siteCircle.addTo(this.siteGroup)
                .on('click', (event) => {
                    const popUp = event.target.getPopup();
                    popUp.setContent(renderSitesPopup(site, formatMessage, false));
                })
                .bindPopup()
                .on('mouseover', () => {
                    const lat = site.latitude;
                    const lng = site.longitude;
                    const item = {
                        label: `${formatMessage(MESSAGES.site)}: ${site.name} `,
                    };
                    this.updateTooltipSmall(item, lat, lng);
                })
                .on('mouseout', () => {
                    this.updateTooltipSmall();
                });
        }
    }
    updateTraps(fiitToBound = true) {
        const {
            site,
            intl: {
                formatMessage,
            },
        } = this.props;
        this.trapsGroup.clearLayers();
        if (site.traps) {
            site.traps.forEach((trapItem) => {
                if ((trapItem.is_selected !== undefined &&
                    trapItem.is_selected &&
                    this.isItemVisible('selected-traps')) ||
                    (!trapItem.is_selected && this.isItemVisible('not-selected-traps'))) {
                    const trapCircle = L.marker(
                        [trapItem.latitude, trapItem.longitude],
                        {
                            icon: renderDivIcon(
                                '',
                                `traps small ${trapItem.is_selected !== undefined && trapItem.is_selected ? 'selected' : ''} ${trapItem.is_selected !== undefined && !trapItem.is_selected ? 'not-selected' : ''}`,
                                30,
                            ),
                        },
                    );
                    trapCircle.addTo(this.trapsGroup)
                        .on('click', () => {
                            this.props.getDetail(trapItem.id, 'traps', 'showEditTrapsModale');
                        })
                        .on('mouseover', () => {
                            const lat = trapItem.latitude;
                            const lng = trapItem.longitude;
                            const item = {
                                label: `${formatMessage(MESSAGES.trap)}: ${trapItem.name} `,
                            };
                            this.updateTooltipSmall(item, lat, lng);
                        })
                        .on('mouseout', () => {
                            this.updateTooltipSmall();
                        });
                }
            });
            if (fiitToBound) {
                this.fitToBounds();
            }
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
        defaultFitToBound(map, this.trapsGroup.getBounds(), 15);
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

TrapsMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    site: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
    mapUpdated: PropTypes.bool.isRequired,
    itemsToShow: PropTypes.array.isRequired,
    setMapUpdate: PropTypes.func.isRequired,
    getDetail: PropTypes.func.isRequired,
};

export default injectIntl(TrapsMap);
