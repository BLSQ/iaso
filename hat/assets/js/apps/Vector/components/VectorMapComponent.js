import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';
import moment from 'moment';
import 'leaflet.markercluster'; // eslint-disable-line
import geoUtils from '../../Plannings/utils/geo';
import * as zoomBar from '../../Plannings/components/leaflet/zoom-bar' // eslint-disable-line

import {
    updateBaseLayer,
    MESSAGES,
    onResizeMap,
    defaultFitToBound,
    includeControlsInMap,
} from '../../../utils/mapUtils';

let exportControl;
class VectorMapComponent extends Component {
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
                // where to plot the selected markers
                villages: new L.FeatureGroup(),
                chosenMarker: null, // marker used to bold the chosen item
            },
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map, true);
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

            if (hasChanged(prevProps, this.props, 'traps') ||
                hasChanged(prevProps, this.props, 'targets') ||
                hasChanged(prevProps, this.props, 'villages')) {
                this.updateItems();
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Contrôle de vecteur');
    }

    /* ***************************************************************************
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
        map.createPane('custom-pane-highlight-buffer');
        map.createPane('custom-pane-shadows');
        map.createPane('custom-pane-markers');
        map.createPane('custom-pane-highlight');
        map.createPane('custom-pane-selected');
        map.createPane('custom-pane-labels');
        map.createPane('custom-pane-buffer');
        map.createPane('custom-pane-villages');
        this.map = map;
    }

    includeDefaultLayersInMap() {
        //
        // include relevant and constant layers
        //
        const { map } = this;
        const { layers } = this.state;
        this.itemsGroup = new L.FeatureGroup();
        map.addLayer(this.itemsGroup);

        //
        // plot the ALL boundaries
        //

        const shapeOptions = type => ({
            pane: 'custom-pane-shapes',
            style: () => ({ className: String.raw`map-layer ${type}` }),
            onEachFeature: (feature, layer) => {
                this.addLayerEvents(layer, feature.properties);
            },
        });

        const shapes = {
            province: new L.FeatureGroup(),
        };

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

        // create marker for the chosen item
        const chosenMarker = L.circle(map.getCenter(), {
            className: 'map-marker chosen',
            pane: 'custom-pane-selected',
            radius: 0,
        });
        layers.chosenMarker = chosenMarker;
    }

    /* ***************************************************************************
   * UPDATE STATE
   *************************************************************************** */

    updateItems() {
        const { traps, targets, villages } = this.props;
        const renderDivIcon = (content, key, size) => L.divIcon({
            html: `<div><span>${content}</span></div>`,
            className: `marker-cluster marker-cluster-${key}`,
            iconSize: L.point(size, size),
        });
        const markersVillages = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages', 40),
        });
        const markersVillagesWithCases = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages-with-cases', 40),
        });
        const markersTargets = L.markerClusterGroup({
            maxClusterRadius: 30,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'targets', 40),
        });
        const markersTraps = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'traps', 40),
        });

        this.itemsGroup.clearLayers();

        targets.map((target) => {
            markersTargets.addLayer(L.marker(
                [target.latitude, target.longitude],
                { icon: renderDivIcon('1', 'targets small', 30) },
            )
                .on('click', (event) => {
                    const popUp = event.target.getPopup();
                    this.props.selectMarker(target.id, 'targets')
                        .then((response) => {
                            popUp.setContent(this.renderTargetsPopup(response));
                        });
                })
                .on('mouseover', () => {
                    this.updateTooltipSmall(target);
                })
                .on('mouseout', () => {
                    this.updateTooltipSmall();
                })
                .bindPopup());
            return true;
        });

        this.itemsGroup.addLayer(markersTargets);

        traps.map((trap) => {
            markersTraps.addLayer(L.marker(
                [trap.latitude, trap.longitude],
                { icon: renderDivIcon('1', 'traps small', 30) },
            )
                .on('click', (event) => {
                    const popUp = event.target.getPopup();
                    this.props.selectMarker(trap.id, 'traps')
                        .then((response) => {
                            popUp.setContent(this.renderTrapsPopup(response));
                        });
                })
                .on('mouseover', () => {
                    this.updateTooltipSmall(trap);
                })
                .on('mouseout', () => {
                    this.updateTooltipSmall();
                })
                .bindPopup());

            return true;
        });
        this.itemsGroup.addLayer(markersTraps);

        Object.keys(villages).forEach((key) => {
            const village = villages[key];
            if (village) {
                const newMarker = L.marker(
                    [village.latitude, village.longitude],
                    { icon: renderDivIcon('1', `villages${village.nr_positive_cases !== 0 ? '-with-cases small' : ' small'}`, 30) },
                )
                    .on('click', (event) => {
                        const popUp = event.target.getPopup();
                        this.props.selectMarker(village.id, 'villages')
                            .then((response) => {
                                popUp.setContent(this.renderVillagesPopup(response));
                            });
                    })
                    .on('mouseover', () => {
                        this.updateTooltipSmall(village);
                    })
                    .on('mouseout', () => {
                        this.updateTooltipSmall();
                    })
                    .bindPopup();
                if (village.nr_positive_cases === 0) {
                    markersVillages.addLayer(newMarker);
                } else {
                    markersVillagesWithCases.addLayer(newMarker);
                }
            }
            return true;
        });
        this.itemsGroup.addLayer(markersVillages);
        this.itemsGroup.addLayer(markersVillagesWithCases);
        this.fitToBounds();
    }

    updateTooltipSmall(item) {
        if (item && (item.label || item.name)) {
            this.state.containers.tooltipSmall.innerHTML =
                item.label ? item.label : item.name;
        } else {
            this.state.containers.tooltipSmall.innerHTML = '';
        }
    }


    /* ***************************************************************************
   * ACTIONS
   *************************************************************************** */

    fitToBounds() {
        const { map } = this;
        defaultFitToBound(map, this.itemsGroup.getBounds(), 13);
    }

    /* ***************************************************************************
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

    renderTrapsPopup(trap) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <h6>
                        ${formatMessage({ defaultMessage: 'Trap', id: 'vector.labels.trap' })}:
                    </h6>
                    <div>
                        ${formatMessage({ defaultMessage: 'Zone', id: 'vector.labels.Zone' })}:
                        <span>${trap.zone === '' ? '/' : trap.zone}</span></div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}:
                        <span>${trap.latitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}:
                        <span>${trap.longitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Habitat', id: 'vector.labels.habitat' })}:
                        <span>${trap.habitat === '' ? '/' : trap.habitat}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Premier relevé', id: 'vector.labels.first_survey' })}:
                        <span>${trap.first_survey}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Date du premier relevé', id: 'vector.labels.first_survey_date' })}:
                        <span>${moment(trap.first_survey_date).format('hh:mm YYYY-MM-DD')}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Compte', id: 'vector.labels.count' })}:
                        <span>${trap.count}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Total', id: 'vector.labels.total' })}:
                        <span>${trap.total}</span>
                    </div>
                </section>`;
    }
    renderTargetsPopup(target) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <h6>
                        ${formatMessage({ defaultMessage: 'Target', id: 'vector.labels.target' })}:
                    </h6>
                    <div>
                        ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}:
                        <span>${target.name}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Altitude', id: 'vector.labels.altitude' })}:
                        <span>${target.altitude}</span>
                    <div>
                        ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}:
                        <span>${target.latitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}:
                        <span>${target.longitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Date', id: 'vector.labels.date_time' })}:
                        <span>${moment(target.date_time).format('hh:mm YYYY-MM-DD')}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Déploiement', id: 'vector.labels.deployment' })}:
                        <span>${target.deployment}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Rivière', id: 'vector.labels.river' })}:
                        <span>${target.river}</span>
                    </div>
                </section>`;
    }
    renderVillagesPopup(village) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <h6>
                        ${formatMessage({ defaultMessage: 'Village', id: 'vector.labels.village' })}:
                    </h6>
                    <div>
                        ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}:
                        <span>${village.name}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'As', id: 'vector.labels.as' })}:
                        <span>${village.as}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Zs', id: 'vector.labels.zs' })}:
                        <span>${village.zs}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}:
                        <span>${village.latitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}:
                        <span>${village.longitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Cas positifs', id: 'vector.labels.nr_positive_cases' })}:
                        <span>${village.nr_positive_cases}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Population', id: 'vector.labels.population' })}:
                        <span>${village.population}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Source GPS', id: 'vector.labels.gps_source' })}:
                        <span>${village.gps_source}</span>
                    </div>
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

VectorMapComponent.defaultProps = {
};

VectorMapComponent.propTypes = {
    selectMarker: PropTypes.func.isRequired,
    baseLayer: PropTypes.string.isRequired,
    traps: PropTypes.arrayOf(PropTypes.object).isRequired,
    targets: PropTypes.arrayOf(PropTypes.object).isRequired,
    villages: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
};

export default injectIntl(VectorMapComponent);
