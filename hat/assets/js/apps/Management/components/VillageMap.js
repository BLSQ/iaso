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
import * as d3 from 'd3';

import {
    updateBaseLayer,
    includeControlsInMap,
    onResizeMap,
    defaultFitToBound,
    genericMap,
    zooms,
} from '../../../utils//map/mapUtils';

const shapeOptions = (type, element) => ({
    pane: 'custom-pane-shapes',
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            className: `map-layer ${type}-${feature.properties.pk} ${type} ${type === 'zs' ? 'no-border' : ''}`,
        });
        element.addLayerEvents(layer, feature.properties);
    },
});

const shapeAsOptions = (type, element) => ({
    pane: 'custom-pane-as-shapes',
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            className: `no-border map-layer ${type}-${feature.properties.pk} ${type}`,
        });
        element.addLayerEvents(layer, feature.properties);
    },
});

const plotOrHideLayer = (map, minZoom, type) => {
    const paths = d3.selectAll(`.map-layer.${type}`);
    if (map.getZoom() > minZoom) {
        paths.classed('no-border', false);
    } else {
        paths.classed('no-border', true);
    }
};

const reinitShapesColor = () => {
    d3.selectAll('.provinces.map-layer')
        .classed('selected', false);
    d3.selectAll('.as.map-layer')
        .classed('selected', false);
    d3.selectAll('.zs.map-layer')
        .classed('selected', false);
};

const updateShapeColors = (village) => {
    reinitShapesColor();
    if (village.AS_id) {
        d3.select(`.as-${village.AS_id}`)
            .classed('selected', true);
    } else if (village.AS__ZS_id) {
        d3.select(`.zs-${village.AS__ZS_id}`)
            .classed('selected', true);
    } else if (village.AS__ZS__province_id) {
        d3.select(`.provinces-${village.AS__ZS__province_id}`)
            .classed('selected', true);
    }
};

let exportControl;
class VillageMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            isFirstLoad: true,
            village: props.village,
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map);
        this.includeDefaultLayersInMap();
        updateShapeColors(this.props.village);
        updateBaseLayer(this.map, this.props.baseLayer);
        this.updateMap(this.props.village);
    }

    componentWillReceiveProps(nextProps) {
        const { map } = this;
        map.whenReady(() => {
            if (this.props.baseLayer !== nextProps.baseLayer) {
                updateBaseLayer(this.map, nextProps.baseLayer);
            }
            if (this.props.village.latitude !== nextProps.village.latitude ||
                this.props.village.longitude !== nextProps.village.longitude) {
                this.updateMap(nextProps.village);
            }
            if (this.props.village.AS__ZS__province_id !== nextProps.village.AS__ZS__province_id ||
                this.props.village.AS__ZS_id !== nextProps.village.AS__ZS_id ||
                this.props.village.AS_id !== nextProps.village.AS_id) {
                updateShapeColors(nextProps.village);
            }
        });
        this.setState({
            village: nextProps.village,
        });
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    onResize(width, height) {
        const { map } = this;
        exportControl = onResizeMap(width, height, exportControl, map, 'Village');
    }

    /*
***************************************************************************
* CREATE MAP
*************************************************************************** */

    createMap() {
        const map = genericMap(this.mapNode);

        // create panes to preserve z-index order
        map.createPane('custom-pane-shapes');
        map.createPane('custom-pane-as-shapes');
        map.createPane('custom-pane-markers');
        map.on('mouseup', () => {
            map.dragging.enable();
        }).on('click', (event) => {
            reinitShapesColor();
            if (!this.props.village.latitude || !this.props.village.longitude) {
                this.props.updateVillagePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
            }
        });
        this.map = map;
    }

    includeDefaultLayersInMap() {
        const { map } = this;
        this.provinceGroup = new L.FeatureGroup();
        this.asGroup = new L.FeatureGroup();
        this.zsGroup = new L.FeatureGroup();
        this.villageGroup = new L.FeatureGroup();

        map.addLayer(this.villageGroup);
        const {
            geoJson,
        } = this.props;

        this.provinceGroup.addLayer(L.geoJson(geoJson.provinces, shapeOptions('provinces', this)));
        this.zsGroup.addLayer(L.geoJson(geoJson.zs, shapeOptions('zs', this)));
        this.asGroup.addLayer(L.geoJson(geoJson.as, shapeAsOptions('as', this)));
        this.asGroup.on('click', (event) => {
            const { village } = this.state;
            if (event.sourceTarget.feature.properties.ZS && village.latitude === 0 && village.longitude === 0) {
                const zone = geoJson.zs.features.filter(z => parseInt(z.id, 10) === event.sourceTarget.feature.properties.ZS)[0];
                this.props.updateVillageLocation({
                    AS__ZS_id: zone.id,
                    AS__ZS__province_id: `${zone.properties.province}`,
                    AS_id: event.sourceTarget.feature.id,
                });
            }
            if (village.latitude === 0 && village.longitude === 0) {
                this.props.updateVillagePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
            }
        }).on('mouseup', (event) => {
            map.getPane('custom-pane-as-shapes').style.zIndex = 400;
            if (!map.dragging._enabled && !map.boxZoom._box) {
                this.props.updateVillagePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
                const { village } = this.state;
                if (event.sourceTarget.feature.properties.ZS && village && !map.dragging._enabled) {
                    const zone = geoJson.zs.features.filter(z => parseInt(z.id, 10) === event.sourceTarget.feature.properties.ZS)[0];
                    const zsId = parseInt(zone.id, 10);
                    const provinceId = parseInt(zone.properties.province, 10);
                    const asId = parseInt(event.sourceTarget.feature.id, 10);
                    this.props.updateVillageLocation({
                        AS__ZS_id: zsId,
                        AS__ZS__province_id: provinceId,
                        AS_id: asId,
                    });
                }
            }
        });

        map.addLayer(this.provinceGroup);
        map.addLayer(this.zsGroup);
        map.addLayer(this.asGroup);
        this.state.defaultBounds = this.provinceGroup.getBounds();

        L.DomEvent.on(map, 'zoomend', () => {
            plotOrHideLayer(map, zooms.zs, 'zs');
            plotOrHideLayer(map, zooms.as, 'as');
        });
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */


    updateMap(village) {
        const { map } = this;
        this.villageGroup.clearLayers();
        const color = 'blue';
        if (village && village.latitude !== 0 && village.longitude !== 0) {
            const newVillage = L.circle([
                village.latitude ? village.latitude : 0,
                village.longitude ? village.longitude : 0,
            ], {
                color,
                fillColor: color,
                fillOpacity: 0.5,
                radius: 500,
                pane: 'custom-pane-markers',
            }).on('mousedown', () => {
                map.dragging.disable();
                map.getPane('custom-pane-as-shapes').style.zIndex = 650;
                map.on('mousemove', (event) => {
                    if (!map.dragging._enabled) {
                        newVillage.setLatLng([event.latlng.lat, event.latlng.lng]);
                    }
                });
            });
            newVillage.addTo(this.villageGroup);
        }

        if (this.state.isFirstLoad) {
            this.fitToBounds();
            this.setState({
                isFirstLoad: false,
            });
        }
    }

    updateTooltipSmall(item) {
        const { map } = this;
        const currentZoom = map.getZoom();
        if (item) {
            if (item.ZS) {
                const currentZS = this.props.geoJson.zs.features.find(z => z.id === item.ZS);
                this.state.containers.tooltipSmall.innerHTML = `AS: ${item.name} - ZS: ${currentZS ? currentZS.properties.name : '--'}`;
            } else {
                this.state.containers.tooltipSmall.innerHTML = `${currentZoom <= zooms.zs ? 'Province' : 'ZS'}: ${item.name}`;
            }
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
        defaultFitToBound(map, this.villageGroup.getBounds(), 10);
    }

    /*
***************************************************************************
* HELPERS
*************************************************************************** */

    addLayerEvents(layer, item) {
        const { map } = this;
        layer.on({
            click: (event) => {
                L.DomEvent.stop(event);
            },
            contextmenu: (event) => {
                L.DomEvent.stop(event);
            },
            mouseover: (event) => {
                L.DomEvent.stop(event);
                if (map.dragging._enabled) {
                    this.updateTooltipSmall(item);
                }
            },
            mouseout: (event) => {
                L.DomEvent.stop(event);
                // this.updateTooltipSmall();
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
VillageMap.defaultProps = {
    geoJson: {},
    village: undefined,
};

VillageMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    geoJson: PropTypes.object,
    intl: intlShape.isRequired,
    village: PropTypes.object,
    updateVillagePosition: PropTypes.func.isRequired,
    updateVillageLocation: PropTypes.func.isRequired,
    filters: PropTypes.array.isRequired,
};

export default injectIntl(VillageMap);
