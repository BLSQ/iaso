import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import L from 'leaflet';

import { updateBaseLayer } from '../../../utils//map/mapUtils';

const mapZonesDatas = (zones, geoZones) => {
    const geoZonesTemp = {
        ...geoZones,
    };
    geoZones.features.forEach((gz, index) => {
        const zone = zones.find(z => gz.id === z.id);
        if (zone) {
            const geoZone = {
                ...gz,
                nr_positive_cases: zone.nr_positive_cases,
            };
            geoZonesTemp.features[index] = geoZone;
        }
    });
    geoZonesTemp.features = geoZonesTemp.features.sort((a, b) => {
        if (a.nr_positive_cases < b.nr_positive_cases) {
            return -1;
        }
        return 1;
    });
    return geoZonesTemp;
};


class HomeMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {
        this.createMap();
        this.addLegend();
        this.includeDefaultLayersInMap();
        this.map.scrollWheelZoom.disable();
        updateBaseLayer(this.map, 'osm');
        this.updateShapes();
        this.fitToBounds();
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    createMap() {
        const map = L.map(this.mapNode, { zoomControl: false, dragging: false });
        map.createPane('custom-pane-shapes');
        this.map = map;
    }

    addLegend() {
        const { map } = this;
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        const legend = L.control({ position: 'topleft' });
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            let innerHTML = `<h6>${formatMessage({ defaultMessage: 'Légende', id: 'home.labels.title' })}</h6>`;
            innerHTML += `<div class="endemic">${formatMessage({
                defaultMessage: 'Zones de santé endémiques sur les trois dernières années',
                id: 'home.labels.endemic',
            })}</div>`;
            innerHTML += `<div class="non-endemic">${formatMessage({
                defaultMessage: 'Zones de santé non endémiques sur les trois dernières années',
                id: 'home.labels.nonendemic',
            })}</div>`;
            div.innerHTML = innerHTML;
            return div;
        };
        legend.addTo(map);
    }

    includeDefaultLayersInMap() {
        const { map } = this;
        this.zonesGroup = new L.FeatureGroup();
        map.addLayer(this.zonesGroup);
    }

    updateShapes() {
        const { zones, geoZones } = this.props;
        const mappedGeoZones = mapZonesDatas(zones, geoZones);
        this.zonesGroup.clearLayers();
        const zonesShapes = L.geoJSON(mappedGeoZones, {
            pane: 'custom-pane-shapes',
            className: 'home-zones',
            style(feature) {
                const tempStyle = {
                    color: feature.nr_positive_cases > 0 ? 'red' : 'green',
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
    intl: intlShape.isRequired,
};

export default injectIntl(HomeMap);
