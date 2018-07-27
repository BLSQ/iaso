/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import L from 'leaflet';
import moment from 'moment';
import * as topojson from 'topojson';
import geoUtils from '../../Plannings/utils/geo';
import * as zoomBar from '../../Plannings/components/leaflet/zoom-bar';


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

class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containers: {},
            overlays: {},

            layers: {
                // where to plot the selected markers
                villages: new L.FeatureGroup(),
                chosenMarker: null, // marker used to bold the chosen item
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

    componentDidUpdate(prevProps) {
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);

        map.whenReady(() => {
            // only call if base layer changed
            if (hasChanged(prevProps, this.props, 'baseLayer')) {
                this.updateBaseLayer();
            }

            // only call if one of the overlays changed
            if (hasChanged(prevProps, this.props, 'overlays')) {
                this.updateOverlays();
            }

            if (hasChanged(prevProps, this.props, 'villages') || hasChanged(prevProps, this.props, 'selectedVillageId')) {
                this.updateVillages();
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
        map.createPane('custom-pane-highlight-buffer');
        map.createPane('custom-pane-shadows');
        map.createPane('custom-pane-markers');
        map.createPane('custom-pane-highlight');
        map.createPane('custom-pane-selected');
        map.createPane('custom-pane-labels');
        map.createPane('custom-pane-buffer');
        this.map = map;
    }

    includeControlsInMap() {
        // The order in which the controls are added matters
        const { formatMessage } = this.props.intl;
        const { containers } = this.state;
        const { map } = this;
        //
        // In TOP-LEFT
        // .- zoom bar
        //
        // In TOP-RIGHT
        // .- fullscreen warning
        //
        // In BOTTOM-RIGHT
        // .- metric scale
        //
        // In BOTTOM-LEFT
        // .- tooltip-small
        // .- tooltip-large
        //

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

        const tooltipLargeControl = L.control({ position: 'bottomleft' });
        tooltipLargeControl.onAdd = () => L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
        tooltipLargeControl.addTo(map);
        containers.tooltipLarge = tooltipLargeControl.getContainer();
    }

    includeDefaultLayersInMap() {
        //
        // include relevant and constant layers
        //
        const { map } = this;
        const { layers } = this.state;
        this.villageGroup = new L.FeatureGroup();
        map.addLayer(this.villageGroup);
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


        const plotOrHideLayer = (minZoom, type) => {
            if (shapes[type]) {
                const layer = shapes[type];
                if (map.getZoom() > minZoom) {
                    if (!map.hasLayer(layer)) {
                        map.addLayer(layer);
                    }
                } else if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            } else if (map.getZoom() > minZoom) {
                shapes[type] = new L.FeatureGroup();
                this.props.getShape(type)
                    .then((response) => {
                        const shape = shapes[type];
                        const data = topojson.feature(response, response.objects[`${type}s`]);
                        data.features.forEach(geoUtils.extendBasic);
                        const minZoomTemp = zooms[type];
                        shape.addLayer(L.geoJson(data, shapeOptions(type)));
                        plotOrHideLayer(minZoomTemp, type);
                    });
            }
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

        L.DomEvent.on(map, 'zoomend', () => {
            plotOrHideLayer(zooms.zone, 'zone');
            plotOrHideLayer(zooms.area, 'area');
        });

        // create marker for the chosen item
        const chosenMarker = L.circle(map.getCenter(), {
            className: 'map-marker chosen',
            pane: 'custom-pane-selected',
            radius: 0,
        });
        layers.chosenMarker = chosenMarker;
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

    updateOverlays() {
        const { map } = this;

        Object.keys(this.props.overlays).forEach((key) => {
            const active = this.props.overlays[key];
            const layer = this.state.overlays[key];
            if (active && !map.hasLayer(layer)) {
                layer.addTo(map);
            } else if (!active && map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
    }
    // 'YES': Villages from Z.S.
    // 'NO': Villages not from Z.S.
    // 'OTHER': Locations where people are found during campaigns
    // 'NA': Villages from satellite (unknown)
    updateVillages() {
        const { villages } = this.props;
        this.villageGroup.clearLayers();
        if (villages) {
            villages.map((village, index) => {
                let color = 'blue';
                if (this.props.selectedVillageId && (village.id === this.props.selectedVillageId)) {
                    color = '#FF3824';
                } else {
                    color = '#22955A';
                }
                const villageCircle = L.circle([village.latitude, village.longitude], {
                    color,
                    fillColor: color,
                    fillOpacity: 0.2,
                    radius: 500,
                    pane: 'custom-pane-markers',
                })
                    .addTo(this.villageGroup)
                    .on('click', (event) => {
                        const popUp = event.target.getPopup();
                        popUp.setContent(this.renderVillagesPopup(village));
                    })
                    .on('mouseover', () => {
                        this.updateTooltipSmall(village);
                    })
                    .on('mouseout', () => {
                        this.updateTooltipSmall();
                    })
                    .bindPopup();


                const villageLabel = L.tooltip({
                    permanent: true,
                    direction: 'right',
                    className: 'text',
                })
                    .setLatLng([village.latitude, village.longitude + 0.003])
                    .setContent(`${index + 1} - ${village.name}`)
                    .addTo(this.villageGroup);
                return true;
            });
            this.fitToBounds();
        }
    }

    updateTooltipSmall(item) {
        if (item) {
            this.state.containers.tooltipSmall.innerHTML = item.label ? item.label : item.name;
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
            const bounds = this.villageGroup.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom: MAX_ZOOM });
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
    renderVillagesPopup(village) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <div>
                        ${formatMessage({ defaultMessage: 'Nom', id: 'main.label.name' })}:
                        <span>${village.name}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Jours', id: 'main.label.days' })}:
                        <span>${moment(village.original.first_test_date).format('DD-MM-YYYY')} - ${moment(village.original.last_test_date).format('DD-MM-YYYY')}</span>
                    </div>

                    <table>
                        <tbody>
                            <tr><td>CATT</td><td>${village.original.catt_count}</td></tr>
                            <tr><td>RDT</td><td>${village.original.rdt_count}</td></tr>
                            <tr><td>PG</td><td>${village.original.pg_count}</td></tr>
                            <tr><td>MAECT</td><td>${village.original.maect_count}</td></tr>
                            <tr><td>PL</td><td>${village.original.pl_count}</td></tr>
                            <tr><td>Total</td><td>${village.original.test_count}</td></tr>
                        </tbody>
                    </table>
                </section>`;
    }

    render() {
        return <div ref={(node) => { this.mapNode = node; }} className="map-container" />;
    }
}
Map.defaultProps = {
    selectedVillageId: null,
    villages: {},
};

Map.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    overlays: PropTypes.object.isRequired,
    villages: PropTypes.array,
    intl: intlShape.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectedVillageId: PropTypes.number,
    getShape: PropTypes.func.isRequired,
};

export default injectIntl(Map);
