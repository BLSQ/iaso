/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import L from 'leaflet';
import geoUtils from '../../Plannings/utils/geo';
import { getZsName, clone } from '../../../utils';


// map base layers
const tileOptions = { keepBuffer: 4 };
const arcgisPattern = 'https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{z}/{y}/{x}.jpg';
const BASE_LAYERS = {
    blank: L.tileLayer(''),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileOptions),
    'arcgis-street': L.tileLayer(arcgisPattern.replace('{}', 'World_Street_Map'), tileOptions),
    'arcgis-satellite': L.tileLayer(arcgisPattern.replace('{}', 'World_Imagery'), { ...tileOptions, maxZoom: 16 }),
    'arcgis-topo': L.tileLayer(arcgisPattern.replace('{}', 'World_Topo_Map'), { ...tileOptions, maxZoom: 17 }),
};


const MESSAGES = defineMessages({
    'fit-to-bounds': {
        defaultMessage: 'Center to relevant villages',
        id: 'locator.label.fitToBounds',
    },
    'box-zoom-title': {
        defaultMessage: 'Draw a square on the map to zoom in to an area',
        id: 'locator.label.zoom.box',
    },
    'info-zoom-title': {
        defaultMessage: 'Current zoom level',
        id: 'locator.label.zoom.info',
    },
});


class VillageMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            layers: {
                villages: new L.FeatureGroup(),
            },
        };
    }

    componentDidMount() {
        this.createMap();
        this.includeControlsInMap();
        this.includeDefaultLayersInMap();
        this.updateBaseLayer();
        this.fitToBounds();
    }

    componentWillReceiveProps(nextProps) {
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
        map.whenReady(() => {
            // only call if base layer changed
            if (hasChanged(nextProps, this.props, 'baseLayer')) {
                this.updateBaseLayer();
            }
            if (hasChanged(nextProps, this.props, 'provinces')) {
                this.updateMap();
            }
        });
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
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

    includeControlsInMap() {
        // The order in which the controls are added matters
        const { formatMessage } = this.props.intl;
        const { containers } = this.state;
        const { map } = this;

        // zoom bar control
        L.control.zoombar({
            zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
            zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
            fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
            fitToBounds: () => { this.fitToBounds(); },
            position: 'topleft',
        }).addTo(map);

        // control to visualize warnings
        const warningControl = L.control({ position: 'topright' });
        warningControl.onAdd = () => (L.DomUtil.create('div', 'hide-on-print'));
        warningControl.addTo(map);
        containers.warning = warningControl.getContainer();

        // metric scale
        L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

        // controls to visualize the shape/marker tooltip
        const tooltipSmallControl = L.control({ position: 'bottomleft' });
        tooltipSmallControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
        tooltipSmallControl.addTo(map);
        containers.tooltipSmall = tooltipSmallControl.getContainer();
    }

    includeDefaultLayersInMap() {
        //
        // include relevant and constant layers
        //
        const { map } = this;
        const { layers } = this.state;
        this.provincesGroup = new L.FeatureGroup();
        map.addLayer(this.provincesGroup);
        // assign labels overlay using the existent labels group

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

        // at which zoom can be displayed in map
        const zooms = {
            province: -1, // always in map
            zone: 7,
            area: 9,
        };


        const shape = shapes.province;
        const data = geoUtils.data.province;
        const minZoom = zooms.province;

        shape.addLayer(L.geoJson(data, shapeOptions('province')));
        if (minZoom < 0) {
            // province divisions are always visible and are use as default bounds
            map.addLayer(shape);
            this.state.defaultBounds = shape.getBounds();
        }
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */

    updateBaseLayer() {
        const { baseLayer } = this.props;
        const { map } = this;

        Object.keys(BASE_LAYERS).forEach((key) => {
            const layer = BASE_LAYERS[key];
            if (key === baseLayer) {
                layer.addTo(map);
            } else if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
    }


    updateMap() {
        const {
            geoProvinces,
        } = this.props;
        this.provincesGroup.clearLayers();
        const areas = L.geoJSON(geoProvinces, {
            onEachFeature: (feature, layer) => {
                layer.setStyle({
                    className: 'provinces',
                });
            },
        });
        areas.addTo(this.provincesGroup);
        this.fitToBounds();
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

        // maximum zoom allowed to fit to relevant markers
        const MAX_ZOOM = 13;


        setTimeout(() => {
            const bounds = this.provincesGroup.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom: MAX_ZOOM, padding: [25, 25] });
            }
            map.invalidateSize();
        }, 1);
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

    injectI18n(component) {
        // we need to wrap it with `IntlProvider` to use i18n features
        const { locale, messages } = this.props.intl;

        return (
            <IntlProvider locale={locale} messages={messages}>
                {component}
            </IntlProvider>
        );
    }

    render() {
        return <div ref={(node) => { this.mapNode = node; }} className="map-container" />;
    }
}
VillageMap.defaultProps = {
    geoProvinces: {},
};

VillageMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    geoProvinces: PropTypes.object,
    intl: intlShape.isRequired,
};

export default injectIntl(VillageMap);
