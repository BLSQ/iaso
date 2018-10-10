/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import L from 'leaflet';
import * as d3 from 'd3';
import geoUtils from '../../Plannings/utils/geo';


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


// at which zoom can be displayed in map
const zooms = {
    province: -1, // always in map
    zs: 7,
    as: 9,
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
        this.includeControlsInMap();
        this.includeDefaultLayersInMap();
        updateShapeColors(this.props.village);
        this.updateBaseLayer(this.props.baseLayer);
        this.updateMap(this.props.village);
    }

    componentWillReceiveProps(nextProps) {
        const { map } = this;
        map.whenReady(() => {
            if (this.props.baseLayer !== nextProps.baseLayer) {
                this.updateBaseLayer(nextProps.baseLayer);
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
                const zone = geoJson.zs.features.filter(z => parseInt(z.properties.pk, 10) === event.sourceTarget.feature.properties.ZS)[0];
                this.props.updateVillageLocation({
                    AS__ZS_id: zone.properties.pk,
                    AS__ZS__province_id: `${zone.properties.province}`,
                    AS_id: event.sourceTarget.feature.properties.pk,
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
                    const zone = geoJson.zs.features.filter(z => parseInt(z.properties.pk, 10) === event.sourceTarget.feature.properties.ZS)[0];
                    const zsId = parseInt(zone.properties.pk, 10);
                    const provinceId = parseInt(zone.properties.province, 10);
                    const asId = parseInt(event.sourceTarget.feature.properties.pk, 10);
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

    updateBaseLayer(baseLayer) {
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


    updateMap(village) {
        const { map } = this;
        this.villageGroup.clearLayers();
        const color = 'blue';
        if (village && village.latitude !== 0 && village.longitude !== 0) {
            const newVillage = L.circle([village.latitude, village.longitude], {
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
                const currentZS = this.props.geoJson.zs.features.filter(z => parseInt(z.properties.pk, 10) === item.ZS)[0];
                this.state.containers.tooltipSmall.innerHTML = `AS: ${item.name} - ZS: ${currentZS.properties.name}`;
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

        setTimeout(() => {
            const bounds = this.villageGroup.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom: 10, padding: [100, 100] });
            }
            map.invalidateSize();
        }, 1);
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
