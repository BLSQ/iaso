/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import { injectIntl, intlShape } from 'react-intl';
import ReactResizeDetector from 'react-resize-detector';
import PrintControl from 'react-leaflet-easyprint';

import PropTypes from 'prop-types';

import L from 'leaflet';
import * as d3 from 'd3';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import {
    updateBaseLayer,
    includeControlsInMap,
    onResizeMap,
    defaultFitToBound,
    zooms,
    genericMap,
} from '../../../utils/map/mapUtils';

const shapeOptions = (type, element) => ({
    pane: 'custom-pane-shapes',
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            className: `map-layer ${type}-${feature.properties.pk} ${type} ${type === 'zs' ? 'no-border' : ''}`,
        });
        element.addLayerEvents(layer, feature.properties);
    },
});


const drawShapeOptions = element => ({
    pane: 'custom-draw',
    stroke: false,
    title: 'super title',
    color: 'blue',
    onEachFeature: (feature, layer) => {
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

let exportControl;
class ShapeMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            isFirstLoad: true,
            shapeItem: props.shapeItem,
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map);
        this.includeDefaultLayersInMap();
        updateBaseLayer(this.map, this.props.baseLayer);
        this.srawshape(this.state.shapeItem);
    }

    componentWillReceiveProps(nextProps) {
        const { map } = this;
        map.whenReady(() => {
            if (this.props.baseLayer !== nextProps.baseLayer) {
                updateBaseLayer(this.map, nextProps.baseLayer);
            }
        });
        this.setState({
            shapeItem: nextProps.shapeItem,
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
        map.createPane('custom-draw');
        this.map = map;
    }

    includeDefaultLayersInMap() {
        const { map } = this;
        this.provinceGroup = new L.FeatureGroup();
        this.zsGroup = new L.FeatureGroup();
        this.asGroup = new L.FeatureGroup();

        const {
            geoJson,
        } = this.props;

        this.provinceGroup.addLayer(L.geoJson(geoJson.provinces, shapeOptions('provinces', this)));
        this.zsGroup.addLayer(L.geoJson(geoJson.zs, shapeOptions('zs', this)));
        this.asGroup.addLayer(L.geoJson(geoJson.as, shapeOptions('as', this)));

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


    srawshape(shapeItem) {
        const { map } = this;
        const geoLayer = L.geoJson(shapeItem.geo_json, drawShapeOptions(this));
        if (map.hasLayer(this.shapesLayer)) {
            map.removeLayer(this.shapesLayer);
        }
        this.shapesLayer = new L.FeatureGroup([geoLayer]);

        const shape = geoLayer.getLayers()[0];
        shape.editing.enable();
        this.shapesLayer.addLayer(shape);

        map.addLayer(this.shapesLayer);
        map.on('draw:editvertex', () => {
            const newShapeItem = {
                ...shapeItem,
                geo_json: shape.toGeoJSON(),
            };
            this.props.updateShape(newShapeItem);
        });
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
        if (item && Object.keys(item).length > 0) {
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
        defaultFitToBound(map, this.shapesLayer.getBounds(), 14);
    }

    /*
***************************************************************************
* HELPERS
*************************************************************************** */

    addLayerEvents(layer, item) {
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
            },
        });
    }

    render() {
        return (
            <ReactResizeDetector handleWidth handleHeight onResize={(width, height) => this.onResize(width, height)}>
                <section className="map-parent-container">
                    <div ref={(node) => { this.mapNode = node; }} className="map-container full" />
                </section>
            </ReactResizeDetector>
        );
    }
}
ShapeMap.defaultProps = {
    geoJson: {},
    shapeItem: undefined,
};

ShapeMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    geoJson: PropTypes.object,
    shapeItem: PropTypes.object,
    updateShape: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
};

export default injectIntl(ShapeMap);
