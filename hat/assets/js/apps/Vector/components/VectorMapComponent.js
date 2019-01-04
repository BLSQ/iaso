import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';
import {
    renderSitesPopup,
    renderTargetsPopup,
    renderVillagesPopup,
} from '../utlls/vectorMapUtils';
import 'leaflet.markercluster'; // eslint-disable-line
import * as zoomBar from '../../Plannings/components/leaflet/zoom-bar' // eslint-disable-line

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
            editedItem: undefined,
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map, true);
        this.sitesGroup = new L.FeatureGroup();
        this.map.addLayer(this.sitesGroup);

        this.targetsGroup = new L.FeatureGroup();
        this.map.addLayer(this.targetsGroup);

        this.nonEndemicVillagesGroup = new L.FeatureGroup();
        this.map.addLayer(this.nonEndemicVillagesGroup);

        this.endemicVillagesGroup = new L.FeatureGroup();
        this.map.addLayer(this.endemicVillagesGroup);

        includeDefaultLayersInMap(this);
        updateBaseLayer(this.map, this.props.baseLayer);
        this.fitToBounds();


        this.map.on('popupopen', () => {
            setTimeout(() => {
                const editButton = document.getElementById('edit-button');
                const catchesButton = document.getElementById('catches-button');
                if (editButton) {
                    editButton.addEventListener('click', () => {
                        this.props.editItem(editButton.dataset.type, this.state.editedItem);
                        this.map.closePopup();
                    });
                }
                if (catchesButton) {
                    catchesButton.addEventListener('click', () => {
                        this.props.displayCatches(this.state.editedItem);
                    });
                }
            }, 300);
        });
        this.map.on('popupclose', () => {
            this.setState({ editedItem: undefined });
        });
    }

    componentDidUpdate(prevProps) {
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
        map.whenReady(() => {
            // only call if base layer changed
            if (hasChanged(prevProps, this.props, 'baseLayer')) {
                updateBaseLayer(this.map, this.props.baseLayer);
            }

            if (hasChanged(prevProps, this.props, 'nonEndemicVillages')) {
                this.updateNonEndemicVillages();
            }
            if (hasChanged(prevProps, this.props, 'endemicVillages')) {
                this.updateEndemicVillages();
            }
            if (hasChanged(prevProps, this.props, 'sites')) {
                this.updateSites();
            }
            if (hasChanged(prevProps, this.props, 'targets')) {
                this.updateTargets();
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
        this.map = map;
    }

    /* ***************************************************************************
   * UPDATE STATE
   *************************************************************************** */
    updateSites() {
        const {
            sites,
            intl: {
                formatMessage,
            },
        } = this.props;

        const markersSites = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'sites', 40),
        });
        this.sitesGroup.clearLayers();

        sites.map((site) => {
            markersSites.addLayer(L.marker(
                [site.latitude, site.longitude],
                { icon: renderDivIcon('1', 'sites small', 30) },
            )
                .on('click', (event) => {
                    const popUp = event.target.getPopup();
                    this.props.selectMarker(site.id, 'sites')
                        .then((response) => {
                            this.setState({ editedItem: response });
                            popUp.setContent(renderSitesPopup(response, formatMessage));
                        });
                })
                .on('mouseover', () => {
                    this.updateTooltipSmall(site);
                })
                .on('mouseout', () => {
                    this.updateTooltipSmall();
                })
                .bindPopup());

            return true;
        });
        this.sitesGroup.addLayer(markersSites);
    }

    updateTargets() {
        const {
            targets,
            intl: {
                formatMessage,
            },
        } = this.props;
        const markersTargets = L.markerClusterGroup({
            maxClusterRadius: 30,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'targets', 40),
        });

        this.targetsGroup.clearLayers();

        targets.map((target) => {
            markersTargets.addLayer(L.marker(
                [target.latitude, target.longitude],
                { icon: renderDivIcon('1', 'targets small', 30) },
            )
                .on('click', (event) => {
                    const popUp = event.target.getPopup();
                    this.props.selectMarker(target.id, 'targets')
                        .then((response) => {
                            this.setState({ editedItem: response });
                            popUp.setContent(renderTargetsPopup(response, formatMessage));
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

        this.targetsGroup.addLayer(markersTargets);
    }
    updateNonEndemicVillages() {
        const {
            nonEndemicVillages,
            intl: {
                formatMessage,
            },
        } = this.props;
        const markersNonEndemicVillages = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages', 40),
        });

        this.nonEndemicVillagesGroup.clearLayers();

        Object.keys(nonEndemicVillages).forEach((key) => {
            const village = nonEndemicVillages[key];
            if (village) {
                const newMarker = L.marker(
                    [village.latitude, village.longitude],
                    { icon: renderDivIcon('1', 'villages small', 30) },
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
                markersNonEndemicVillages.addLayer(newMarker);
            }
            return true;
        });
        this.nonEndemicVillagesGroup.addLayer(markersNonEndemicVillages);
    }
    updateEndemicVillages() {
        const {
            endemicVillages,
            intl: {
                formatMessage,
            },
        } = this.props;
        const markersVillagesWithCases = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages-with-cases', 40),
        });

        this.endemicVillagesGroup.clearLayers();

        Object.keys(endemicVillages).forEach((key) => {
            const village = endemicVillages[key];
            if (village) {
                const newMarker = L.marker(
                    [village.latitude, village.longitude],
                    { icon: renderDivIcon('1', 'villages-with-cases small', 30) },
                )
                    .on('click', (event) => {
                        const popUp = event.target.getPopup();
                        this.props.selectMarker(village.id, 'villages')
                            .then((response) => {
                                response.nr_positive_cases = village.nr_positive_cases;
                                popUp.setContent(renderVillagesPopup(response, formatMessage, true));
                            });
                    })
                    .on('mouseover', () => {
                        this.updateTooltipSmall(village);
                    })
                    .on('mouseout', () => {
                        this.updateTooltipSmall();
                    })
                    .bindPopup();

                markersVillagesWithCases.addLayer(newMarker);
            }
            return true;
        });
        this.endemicVillagesGroup.addLayer(markersVillagesWithCases);
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
        const group = new L.FeatureGroup([this.sitesGroup, this.targetsGroup, this.endemicVillagesGroup, this.nonEndemicVillagesGroup]);
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

VectorMapComponent.defaultProps = {
};

VectorMapComponent.propTypes = {
    selectMarker: PropTypes.func.isRequired,
    baseLayer: PropTypes.string.isRequired,
    sites: PropTypes.arrayOf(PropTypes.object).isRequired,
    targets: PropTypes.arrayOf(PropTypes.object).isRequired,
    nonEndemicVillages: PropTypes.object.isRequired,
    endemicVillages: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
    editItem: PropTypes.func.isRequired,
    displayCatches: PropTypes.func.isRequired,
};

export default injectIntl(VectorMapComponent);
