import React, { Component } from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';

import { updateBaseLayer } from '../../../utils/mapUtils';

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
        updateBaseLayer(this.map, 'osm');
        this.updateShapes(this.props.geoZones);
        this.fitToBounds();
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

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

    updateShapes(geoZones) {
        const { zones } = this.props;
        this.zonesGroup.clearLayers();
        const zonesShapes = L.geoJSON(geoZones, {
            pane: 'custom-pane-shapes',
            className: 'home-zones',
            style(feature) {
                const fullZone = zones.find(z => z.id === feature.id);
                const tempStyle = {
                    color: fullZone && fullZone.nr_positive_cases > 0 ? 'red' : 'green',
                };
                return tempStyle;
            },
        });
        zonesShapes.addTo(this.zonesGroup);
    }

    fitToBounds() {
        const { map } = this;
        const bounds = this.zonesGroup.getBounds();
        setTimeout(() => {
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom: 20, padding: [5, 5] });
            }
            map.invalidateSize();
        }, 1);
    }

    render() {
        return (
            <section className="map-parent-container">
                <div ref={(node) => { this.mapNode = node; }} className="map-container" />
            </section>
        );
    }
}

HomeMap.propTypes = {
    geoZones: PropTypes.object.isRequired,
    zones: PropTypes.array.isRequired,
};

export default HomeMap;
