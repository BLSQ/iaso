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
import { getZsName, clone } from '../../../utils';
import shapeUrls from '../../../utils/constants/shapesUrls';

import {
    updateBaseLayer,
    includeControlsInMap,
    onResizeMap,
    defaultFitToBound,
} from '../../../utils/mapUtils';

let exportControl;

const MapDatas = (coordination, workzone, teamGeoScope) => {
    const tempCoordinations = coordination;
    const tempAreas = [];
    coordination.areas.features.map((area) => {
        const tempArea = clone(area);
        delete tempArea.properties.workzoneId;
        delete tempArea.properties.workzone;
        delete tempArea.properties.isInGeoScope;
        tempArea.properties.zsName = getZsName(tempArea.properties.ZS, coordination.zones.features);
        tempArea.properties.isInGeoScope = teamGeoScope && (teamGeoScope[area.properties.pk] !== undefined);
        workzone.as_list.map((workingArea) => {
            if (parseInt(tempArea.properties.pk, 10) === workingArea.id) {
                tempArea.properties.workzoneId = workzone.id;
                tempArea.properties.workzone = workzone.name;
            }
            return null;
        });
        tempAreas.push(tempArea);
        return null;
    });
    tempCoordinations.areas.features = tempAreas;
    return tempCoordinations;
};

class GeoScopeMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            isFirstLoad: true,
            layers: {
                villages: new L.FeatureGroup(),
            },
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map, true);
        this.includeDefaultLayersInMap();
        updateBaseLayer(this.map, this.props.baseLayer);
        this.updateCoordination(MapDatas(this.props.coordination, this.props.workzone, this.props.teamGeoScope));
        this.fitToBounds();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.coordinationId !== this.props.coordinationId) {
            this.setState({
                isFirstLoad: true,
            });
        }
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
        map.whenReady(() => {
            // only call if base layer changed
            if (hasChanged(nextProps, this.props, 'baseLayer')) {
                updateBaseLayer(this.map, nextProps.baseLayer);
            }
            if (hasChanged(nextProps, this.props, 'coordination') ||
                hasChanged(nextProps, this.props, 'teamGeoScope')) {
                this.updateCoordination(MapDatas(nextProps.coordination, nextProps.workzone, nextProps.teamGeoScope));
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
        exportControl = onResizeMap(width, height, exportControl, map, 'Couverture Géographique');
    }

    onEachAsFeature(feature, layer) {
        const toolTipContent =
            `<dl>
            <dt><strong>AS:</strong> ${feature.properties.name}</dt>
            <dt><strong>ZS:</strong> ${feature.properties.zsName}</dt>
        </dl>`;
        layer.bindTooltip(toolTipContent);
        layer.setStyle({
            fillOpacity: 0.5,
        });
        layer.on('click', () => {
            this.props.selectAs(feature.properties);
        });
        layer.on('mouseover', () => {
            layer.setStyle({
                fillOpacity: 0.8,
            });
        });
        layer.on('mouseout', () => {
            layer.setStyle({
                fillOpacity: 0.5,
            });
        });
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
        this.coordinationGroup = new L.FeatureGroup();
        this.zonesGroup = new L.FeatureGroup();
        map.addLayer(this.coordinationGroup);
        map.addLayer(this.zonesGroup);

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

        const shape = shapes.province;
        this.props.getShape(shapeUrls.province)
            .then((response) => {
                shape.addLayer(L.geoJson(response, shapeOptions('province')));
                map.addLayer(shape);
                this.state.defaultBounds = shape.getBounds();
            });
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */


    updateCoordination(coordination) {
        this.coordinationGroup.clearLayers();
        this.zonesGroup.clearLayers();
        const areas = L.geoJSON(coordination.areas, {
            style(feature) {
                const tempStyle = {
                    color: feature.properties.isInGeoScope ? 'green' : 'red',
                };
                return tempStyle;
            },
            onEachFeature: (feature, layer) => {
                this.onEachAsFeature(feature, layer);
            },
        });
        areas.addTo(this.coordinationGroup);

        const zones = L.geoJSON(coordination.zones, {
            onEachFeature: (feature, layer) => {
                layer.setStyle({
                    className: 'zone',
                });
            },
        });
        zones.addTo(this.zonesGroup);
        if (this.state.isFirstLoad) {
            this.fitToBounds();
            this.setState({
                isFirstLoad: false,
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
        defaultFitToBound(map, this.coordinationGroup.getBounds(), 13);
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
        return (
            <ReactResizeDetector handleWidth handleHeight onResize={(width, height) => this.onResize(width, height)}>
                <section className="map-parent-container">
                    <div ref={(node) => { this.mapNode = node; }} className="map-container" />
                </section>
            </ReactResizeDetector>
        );
    }
}
GeoScopeMap.defaultProps = {
    coordination: {},
};

GeoScopeMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    coordination: PropTypes.object,
    workzone: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    selectAs: PropTypes.func.isRequired,
    coordinationId: PropTypes.string.isRequired,
    teamGeoScope: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
};

export default injectIntl(GeoScopeMap);
