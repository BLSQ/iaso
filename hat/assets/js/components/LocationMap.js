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
    arcgisPattern,
    includeControlsInMap,
    onResizeMap,
    defaultFitToBound,
    genericMap,
    zooms,
} from '../utils/map/mapUtils';

const docClick = ({ x, y }) => {
    const ev = document.createEvent('MouseEvent');
    const el = document.elementFromPoint(x, y);
    ev.initMouseEvent(
        'click',
        true /* bubble */, true /* cancelable */,
        window, null,
        x, y, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /* left */, null,
    );
    el.dispatchEvent(ev);
};

const tileOptions = { keepBuffer: 4 };
export const BASE_LAYERS = {
    blank: L.tileLayer(''),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileOptions),
    'arcgis-street': L.tileLayer(arcgisPattern.replace('{}', 'World_Street_Map'), tileOptions),
    'arcgis-satellite': L.tileLayer(arcgisPattern.replace('{}', 'World_Imagery'), { ...tileOptions, maxZoom: 16 }),
    'arcgis-topo': L.tileLayer(arcgisPattern.replace('{}', 'World_Topo_Map'), { ...tileOptions, maxZoom: 17 }),
};

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

const updateShapeColors = (location) => {
    reinitShapesColor();
    if (location.AS_id) {
        d3.select(`.as-${location.AS_id}`)
            .classed('selected', true);
    } else if (location.AS__ZS_id) {
        d3.select(`.zs-${location.AS__ZS_id}`)
            .classed('selected', true);
    } else if (location.AS__ZS__province_id) {
        d3.select(`.provinces-${location.AS__ZS__province_id}`)
            .classed('selected', true);
    }
};

let exportControl;
class LocationMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            isFirstLoad: true,
            location: props.location,
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.locationMap);
        this.includeDefaultLayersInMap();
        updateShapeColors(this.props.location);
        this.updateBaseLayer(this.props.baseLayer);
        this.updateMap(this.props.location);
    }

    componentWillReceiveProps(nextProps) {
        const { locationMap } = this;
        locationMap.whenReady(() => {
            if (this.props.baseLayer !== nextProps.baseLayer) {
                this.updateBaseLayer(nextProps.baseLayer);
            }
            if (this.props.location.latitude !== nextProps.location.latitude
                || this.props.location.longitude !== nextProps.location.longitude) {
                this.updateMap(nextProps.location);
            }
            if (this.props.location.AS__ZS__province_id !== nextProps.location.AS__ZS__province_id
                || this.props.location.AS__ZS_id !== nextProps.location.AS__ZS_id
                || this.props.location.AS_id !== nextProps.location.AS_id) {
                updateShapeColors(nextProps.location);
            }
        });
        this.setState({
            location: nextProps.location,
        });
    }

    componentWillUnmount() {
        if (this.locationMap) {
            this.locationMap.remove();
        }
    }

    onResize(width, height) {
        const { locationMap } = this;
        exportControl = onResizeMap(width, height, exportControl, locationMap, 'Location');
    }

    updateBaseLayer(baseLayer) {
        const { locationMap } = this;
        Object.keys(BASE_LAYERS).forEach((key) => {
            const layer = BASE_LAYERS[key];
            if (key === baseLayer) {
                layer.addTo(locationMap);
            } else if (locationMap.hasLayer(layer)) {
                locationMap.removeLayer(layer);
            }
        });
    }

    /*
***************************************************************************
* CREATE MAP
*************************************************************************** */

    createMap() {
        const locationMap = genericMap(this.smallMapNode);

        // create panes to preserve z-index order
        locationMap.createPane('custom-pane-shapes');
        locationMap.createPane('custom-pane-as-shapes');
        locationMap.createPane('custom-pane-markers');
        locationMap.on('mouseup', () => {
            locationMap.dragging.enable();
        }).on('click', (event) => {
            reinitShapesColor();
            if (!this.props.location.latitude || !this.props.location.longitude) {
                this.props.updatePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
            }
        });
        this.locationMap = locationMap;
    }

    includeDefaultLayersInMap() {
        const { locationMap } = this;
        this.provinceGroup = new L.FeatureGroup();
        this.asGroup = new L.FeatureGroup();
        this.zsGroup = new L.FeatureGroup();
        this.locationGroup = new L.FeatureGroup();

        locationMap.addLayer(this.locationGroup);
        const {
            geoJson,
        } = this.props;

        this.provinceGroup.addLayer(L.geoJson(geoJson.provinces, shapeOptions('provinces', this)));
        this.zsGroup.addLayer(L.geoJson(geoJson.zs, shapeOptions('zs', this)));
        this.asGroup.addLayer(L.geoJson(geoJson.as, shapeAsOptions('as', this)));
        this.asGroup.on('click', (event) => {
            const { location } = this.state;
            if (event.sourceTarget.feature.properties.ZS && location.latitude === 0 && location.longitude === 0) {
                const zone = geoJson.zs.features.filter(z => parseInt(z.id, 10) === event.sourceTarget.feature.properties.ZS)[0];
                this.props.updateLocation({
                    AS__ZS_id: zone.id,
                    AS__ZS__province_id: `${zone.properties.province}`,
                    AS_id: event.sourceTarget.feature.id,
                });
            }
            if (location.latitude === 0 && location.longitude === 0) {
                this.props.updatePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
            }
        }).on('mouseup', (event) => {
            locationMap.getPane('custom-pane-as-shapes').style.zIndex = 400;
            if (!locationMap.dragging._enabled && !locationMap.boxZoom._box) {
                this.props.updatePosition(
                    parseFloat(event.latlng.lat).toFixed(5),
                    parseFloat(event.latlng.lng).toFixed(5),
                );
                const { location } = this.state;
                if (event.sourceTarget.feature.properties.ZS && location && !locationMap.dragging._enabled) {
                    const zone = geoJson.zs.features.filter(z => parseInt(z.id, 10) === event.sourceTarget.feature.properties.ZS)[0];
                    const zsId = parseInt(zone.id, 10);
                    const provinceId = parseInt(zone.properties.province, 10);
                    const asId = parseInt(event.sourceTarget.feature.id, 10);
                    this.props.updateLocation({
                        AS__ZS_id: zsId,
                        AS__ZS__province_id: provinceId,
                        AS_id: asId,
                    });
                }
            }
        });

        locationMap.addLayer(this.provinceGroup);
        locationMap.addLayer(this.zsGroup);
        locationMap.addLayer(this.asGroup);
        this.state.defaultBounds = this.provinceGroup.getBounds();

        L.DomEvent.on(locationMap, 'zoomend', () => {
            plotOrHideLayer(locationMap, zooms.zs, 'zs');
            plotOrHideLayer(locationMap, zooms.as, 'as');
        });
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */


    updateMap(location) {
        console.log('updateMap');
        const { locationMap } = this;

        const color = 'blue';

        if (location && location.latitude !== 0 && location.longitude !== 0) {
            if (this.state.isFirstLoad) {
                this.villageMarker = L.circle([
                    location.latitude ? location.latitude : 0,
                    location.longitude ? location.longitude : 0,
                ], {
                    color,
                    fillColor: color,
                    fillOpacity: 0.5,
                    radius: 500,
                    pane: 'custom-pane-markers',
                }).on('mousedown', () => {
                    locationMap.dragging.disable();
                    locationMap.getPane('custom-pane-as-shapes').style.zIndex = 650;
                    locationMap.on('mousemove', (event) => {
                        if (!locationMap.dragging._enabled) {
                            this.villageMarker.setLatLng([event.latlng.lat, event.latlng.lng]);
                        }
                    });
                });
                this.villageMarker.addTo(this.locationGroup);
                this.fitToBounds();
                this.setState({
                    isFirstLoad: false,
                });
            } else {
                const latlng = new L.LatLng(location.latitude, location.longitude);
                // this.villageMarker.setLatLng(latlng);
                console.log(this.villageMarker.getElement());
                const domElement = this.villageMarker.getElement();
                if (domElement) {
                    const rect = domElement.getBoundingClientRect();
                    docClick(rect);
                    console.log(rect);
                }
            }
        }
    }

    updateTooltipSmall(item) {
        const { locationMap } = this;
        const currentZoom = locationMap.getZoom();
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
        const { locationMap } = this;
        defaultFitToBound(locationMap, this.locationGroup.getBounds(), 10);
    }

    /*
***************************************************************************
* HELPERS
*************************************************************************** */

    addLayerEvents(layer, item) {
        const { locationMap } = this;
        layer.on({
            click: (event) => {
                L.DomEvent.stop(event);
            },
            contextmenu: (event) => {
                L.DomEvent.stop(event);
            },
            mouseover: (event) => {
                L.DomEvent.stop(event);
                if (locationMap.dragging._enabled) {
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
                    <div ref={(node) => { this.smallMapNode = node; }} className="map-container" />
                </section>
            </ReactResizeDetector>
        );
    }
}
LocationMap.defaultProps = {
    geoJson: {},
    location: undefined,
};

LocationMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    geoJson: PropTypes.object,
    intl: intlShape.isRequired,
    location: PropTypes.object,
    updatePosition: PropTypes.func.isRequired,
    updateLocation: PropTypes.func.isRequired,
    filters: PropTypes.array.isRequired,
};

export default injectIntl(LocationMap);
