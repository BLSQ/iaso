import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';
import { renderVillagesPopup } from '../utlls/vectorMapUtils';
import 'leaflet.markercluster'; // eslint-disable-line
import * as zoomBar from '../../../components/leaflet/zoom-bar';

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

const renderDivIcon = (content, key, size) => L.divIcon({
    html: `<div><span>${content}</span></div>`,
    className: `marker-cluster marker-cluster-${key}`,
    iconSize: L.point(size, size),
});

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
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map, true);
        this.sitesGroup = new L.FeatureGroup();
        this.map.addLayer(this.sitesGroup);

        this.trapsGroup = new L.FeatureGroup();
        this.map.addLayer(this.trapsGroup);

        this.targetsGroup = new L.FeatureGroup();
        this.map.addLayer(this.targetsGroup);

        this.catchesGroup = new L.FeatureGroup();
        this.map.addLayer(this.catchesGroup);

        this.nonEndemicVillagesGroup = new L.FeatureGroup();
        this.map.addLayer(this.nonEndemicVillagesGroup);

        this.endemicVillagesGroup = new L.FeatureGroup();
        this.map.addLayer(this.endemicVillagesGroup);

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
            if (this.props.withCluster !== prevProps.withCluster) {
                this.updateVillages(false);
                this.updateVillages(true);
                this.updateMarkers('sites', this.sitesGroup, this.props.sites);
                this.updateMarkers('targets', this.targetsGroup, this.props.targets);
                this.updateMarkers('traps', this.trapsGroup, this.props.traps);
                this.updateMarkers('catches', this.catchesGroup, this.props.catches);
            }

            if (hasChanged(prevProps, this.props, 'nonEndemicVillages')) {
                this.updateVillages(false);
            }
            if (hasChanged(prevProps, this.props, 'endemicVillages')) {
                this.updateVillages(true);
            }
            if (hasChanged(prevProps, this.props, 'sites')) {
                this.updateMarkers('sites', this.sitesGroup, this.props.sites);
            }
            if (hasChanged(prevProps, this.props, 'traps')) {
                this.updateMarkers('traps', this.trapsGroup, this.props.traps);
            }
            if (hasChanged(prevProps, this.props, 'targets')) {
                this.updateMarkers('targets', this.targetsGroup, this.props.targets);
            }
            if (hasChanged(prevProps, this.props, 'catches')) {
                this.updateMarkers('catches', this.catchesGroup, this.props.catches);
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
        const map = genericMap(this.mapNode);

        // create panes to preserve z-index order
        map.createPane('custom-pane-shapes');
        map.createPane('custom-pane-selected');
        map.createPane('custom-pane-markers');
        this.map = map;
    }

    /* ***************************************************************************
   * UPDATE STATE
   *************************************************************************** */
    updateMarkers(key, group, items) {
        const {
            withCluster,
        } = this.props;
        const clusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), key, 40),
        });
        group.clearLayers();

        items.forEach((item) => {
            const marker = L.marker(
                [item.latitude, item.longitude],
                { icon: renderDivIcon('', `${key} small bordered`, 30) },
            );
            marker.on('click', () => {
                this.props.selectMarker(item.id, key === 'sites' ? 'new_sites' : key)
                    .then((response) => {
                        this.props.editItem(key, response);
                    });
            })
                .on('mouseover', () => {
                    this.updateTooltipSmall(item);
                })
                .on('mouseout', () => {
                    this.updateTooltipSmall();
                });
            if (withCluster) {
                clusterGroup.addLayer(marker);
            } else {
                marker.addTo(group);
            }
        });
        if (withCluster) {
            group.addLayer(clusterGroup);
        }
    }

    updateVillages(isEndemic) {
        const {
            nonEndemicVillages,
            endemicVillages,
            intl: {
                formatMessage,
            },
            withCluster,
        } = this.props;
        const villages = isEndemic ? endemicVillages : nonEndemicVillages;
        const group = isEndemic ? this.endemicVillagesGroup : this.nonEndemicVillagesGroup;
        const markersVillages = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), isEndemic ? 'villages-with-cases' : 'villages', 40),
        });

        group.clearLayers();

        Object.keys(villages).forEach((key) => {
            const village = villages[key];
            if (village) {
                const newMarker = L.marker(
                    [village.latitude, village.longitude],
                    { icon: renderDivIcon('', isEndemic ? 'villages-with-cases small bordered' : 'villages small bordered', 30) },
                )
                    .on('click', (event) => {
                        const popUp = event.target.getPopup();
                        this.props.selectMarker(village.id, 'villages')
                            .then((response) => {
                                response.nr_positive_cases = village.nr_positive_cases;
                                popUp.setContent(renderVillagesPopup(response, formatMessage, false));
                            });
                    })
                    .on('mouseover', () => {
                        this.updateTooltipSmall(village);
                    })
                    .on('mouseout', () => {
                        this.updateTooltipSmall();
                    })
                    .bindPopup();
                if (withCluster) {
                    markersVillages.addLayer(newMarker);
                } else {
                    newMarker.addTo(group);
                }
            }
            return true;
        });
        if (withCluster) {
            group.addLayer(markersVillages);
        }
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
        const group = new L.FeatureGroup([
            this.sitesGroup,
            this.trapsGroup,
            this.targetsGroup,
            this.catchesGroup,
            this.endemicVillagesGroup,
            this.nonEndemicVillagesGroup,
        ]);
        defaultFitToBound(map, group.getBounds(), 13);
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

VectorMapComponent.propTypes = {
    selectMarker: PropTypes.func.isRequired,
    baseLayer: PropTypes.string.isRequired,
    sites: PropTypes.arrayOf(PropTypes.object).isRequired,
    traps: PropTypes.arrayOf(PropTypes.object).isRequired,
    targets: PropTypes.arrayOf(PropTypes.object).isRequired,
    catches: PropTypes.arrayOf(PropTypes.object).isRequired,
    nonEndemicVillages: PropTypes.object.isRequired,
    endemicVillages: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
    editItem: PropTypes.func.isRequired,
    withCluster: PropTypes.bool.isRequired,
};

export default injectIntl(VectorMapComponent);
