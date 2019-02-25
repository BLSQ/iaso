/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';

import {
    updateBaseLayer,
    onResizeMap,
} from '../../../utils/mapUtils';

let exportControl;

class HomeMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {
        this.createMap();
        this.includeDefaultLayersInMap();
        this.map.scrollWheelZoom.disable();
        updateBaseLayer(this.map, this.props.baseLayer);
        this.updateShapes(this.props.geoZones);
        this.fitToBounds();
    }


    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    onResize(width, height) {
        const { map } = this;
        exportControl = onResizeMap(width, height, exportControl, map, 'Macro planning');
    }

    /*
***************************************************************************
* CREATE MAP
*************************************************************************** */

    createMap() {
        const map = L.map(this.mapNode, {});
        map.createPane('custom-pane-shapes');
        this.map = map;
    }

    includeDefaultLayersInMap() {
        const { map } = this;
        this.zonesGroup = new L.FeatureGroup();
        map.addLayer(this.zonesGroup);
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */

    updateShapes(geoZones) {
        this.zonesGroup.clearLayers();
        const zones = L.geoJSON(geoZones, {
            pane: 'custom-pane-shapes',
            className: 'home-zones',
            style(feature) {
                const tempStyle = {
                    color: 'gray',
                };
                return tempStyle;
            },
        });
        zones.addTo(this.zonesGroup);
    }
    /*
***************************************************************************
* ACTIONS
*************************************************************************** */

    fitToBounds() {
        const { map } = this;
        const bounds = this.zonesGroup.getBounds();
        const maxZoom = 35;

        setTimeout(() => {
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom, padding: [2, 2] });
            }
            map.invalidateSize();
        }, 1);
    }


    /*
***************************************************************************
* HELPERS
*************************************************************************** */

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

HomeMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    geoZones: PropTypes.object.isRequired,
};

export default HomeMap;
