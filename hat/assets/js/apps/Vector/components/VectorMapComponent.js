import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, defineMessages, injectIntl, intlShape } from 'react-intl';
import * as topojson from 'topojson';
import L from 'leaflet';
import moment from 'moment';
import 'leaflet.markercluster'; // eslint-disable-line
import geoUtils from '../../Microplanning/utils/geo';
import * as zoomBar from '../../Microplanning/components/leaflet/zoom-bar' // eslint-disable-line


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


class VectorMapComponent extends Component {
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

            if (hasChanged(prevProps, this.props, 'traps') ||
                hasChanged(prevProps, this.props, 'targets') ||
                hasChanged(prevProps, this.props, 'villages')) {
                this.updateItems();
            }
        });
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    /* ***************************************************************************
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
        map.createPane('custom-pane-villages');
        this.map = map;
    }

    includeControlsInMap() {
        // The order in which the controls are added matters
        const { formatMessage } = this.props.intl;
        const { containers } = this.state;
        const { map } = this;

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
        this.itemsGroup = new L.FeatureGroup();
        map.addLayer(this.itemsGroup);
        // assign labels overlay using the existent labels group

        //
        // plot the ALL boundaries
        //

        const shapeOptions = type => ({
            pane: 'custom-pane-shapes',
            style: () => ({ className: String.raw`map-layer ${type}` }),
            onEachFeature: (feature, layer) => {
                this.addLayerEvents(layer, feature.properties);
            },
        });

        const shapes = {
            province: new L.FeatureGroup(),
        };

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

    /* ***************************************************************************
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

    updateItems() {
        const { traps, targets, villages } = this.props;
        const renderDivIcon = (content, key, size) => L.divIcon({
            html: `<div><span>${content}</span></div>`,
            className: `marker-cluster marker-cluster-${key}`,
            iconSize: L.point(size, size),
        });
        const markersVillages = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages', 40),
        });
        const markersVillagesWithCases = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'villages-with-cases', 40),
        });
        const markersTargets = L.markerClusterGroup({
            maxClusterRadius: 30,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'targets', 40),
        });
        const markersTraps = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: cluster => renderDivIcon(cluster.getChildCount(), 'traps', 40),
        });

        this.itemsGroup.clearLayers();

        targets.map((target) => {
            markersTargets.addLayer(L.marker(
                [target.latitude, target.longitude],
                { icon: renderDivIcon('1', 'targets small', 30) },
            )
                .on('click', (event) => {
                    const popUp = event.target.getPopup();
                    this.props.selectMarker(target.id, 'targets')
                        .then((response) => {
                            popUp.setContent(this.renderTargetsPopup(response));
                        });
                })
                .on('mouseover', () => {
                    this.updateTooltipSmall(target);
                })
                .on('mouseout', () => {
                    this.updateTooltipSmall();
                })
                .bindPopup());
            return true;
        });

        this.itemsGroup.addLayer(markersTargets);

        traps.map((trap) => {
            markersTraps.addLayer(L.marker(
                [trap.latitude, trap.longitude],
                { icon: renderDivIcon('1', 'traps small', 30) },
            )
                .on('click', (event) => {
                    const popUp = event.target.getPopup();
                    this.props.selectMarker(trap.id, 'traps')
                        .then((response) => {
                            popUp.setContent(this.renderTrapsPopup(response));
                        });
                })
                .on('mouseover', () => {
                    this.updateTooltipSmall(trap);
                })
                .on('mouseout', () => {
                    this.updateTooltipSmall();
                })
                .bindPopup());

            return true;
        });
        this.itemsGroup.addLayer(markersTraps);

        Object.keys(villages).forEach((key) => {
            const village = villages[key];
            if (village) {
                const newMarker = L.marker(
                    [village.latitude, village.longitude],
                    { icon: renderDivIcon('1', `villages${village.nr_positive_cases !== 0 ? '-with-cases small' : ' small'}`, 30) },
                )
                    .on('click', (event) => {
                        const popUp = event.target.getPopup();
                        this.props.selectMarker(village.id, 'villages')
                            .then((response) => {
                                popUp.setContent(this.renderVillagesPopup(response));
                            });
                    })
                    .on('mouseover', () => {
                        this.updateTooltipSmall(village);
                    })
                    .on('mouseout', () => {
                        this.updateTooltipSmall();
                    })
                    .bindPopup();
                if (village.nr_positive_cases === 0) {
                    markersVillages.addLayer(newMarker);
                } else {
                    markersVillagesWithCases.addLayer(newMarker);
                }
            }
            return true;
        });
        this.itemsGroup.addLayer(markersVillages);
        this.itemsGroup.addLayer(markersVillagesWithCases);
        this.fitToBounds();
    }

    updateTooltipSmall(item) {
        if (item && (item.label || item.name)) {
            this.state.containers.tooltipSmall.innerHTML =
                item.label ? item.label : item.name;
        } else {
            this.state.containers.tooltipSmall.innerHTML = '';
        }
    }


    /* ***************************************************************************
   * ACTIONS
   *************************************************************************** */

    fitToBounds() {
        const { map } = this;

        // maximum zoom allowed to fit to relevant markers
        const MAX_ZOOM = 13;


        setTimeout(() => {
            const bounds = this.itemsGroup.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { maxZoom: MAX_ZOOM });
            }
            map.invalidateSize();
        }, 1);
    }

    /* ***************************************************************************
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
    renderTrapsPopup(trap) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <h6>
                        ${formatMessage({ defaultMessage: 'Trap', id: 'vector.labels.trap' })}:
                    </h6>
                    <div>
                        ${formatMessage({ defaultMessage: 'Zone', id: 'vector.labels.Zone' })}:
                        <span>${trap.zone === '' ? '/' : trap.zone}</span></div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}:
                        <span>${trap.latitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}:
                        <span>${trap.longitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Habitat', id: 'vector.labels.habitat' })}:
                        <span>${trap.habitat === '' ? '/' : trap.habitat}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Premier relevé', id: 'vector.labels.first_survey' })}:
                        <span>${trap.first_survey}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Date du premier relevé', id: 'vector.labels.first_survey_date' })}:
                        <span>${moment(trap.first_survey_date).format('hh:mm YYYY-MM-DD')}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Compte', id: 'vector.labels.count' })}:
                        <span>${trap.count}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Total', id: 'vector.labels.total' })}:
                        <span>${trap.total}</span>
                    </div>
                </section>`;
    }
    renderTargetsPopup(target) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <h6>
                        ${formatMessage({ defaultMessage: 'Target', id: 'vector.labels.target' })}:
                    </h6>
                    <div>
                        ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}:
                        <span>${target.name}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Altitude', id: 'vector.labels.altitude' })}:
                        <span>${target.altitude}</span>
                    <div>
                        ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}:
                        <span>${target.latitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}:
                        <span>${target.longitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Date', id: 'vector.labels.date_time' })}:
                        <span>${moment(target.date_time).format('hh:mm YYYY-MM-DD')}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Déploiement', id: 'vector.labels.deployment' })}:
                        <span>${target.deployment}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Rivière', id: 'vector.labels.river' })}:
                        <span>${target.river}</span>
                    </div>
                </section>`;
    }
    renderVillagesPopup(village) {
        const { formatMessage } = this.props.intl;
        return `<section class="custom-popup-container">
                    <h6>
                        ${formatMessage({ defaultMessage: 'Village', id: 'vector.labels.village' })}:
                    </h6>
                    <div>
                        ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}:
                        <span>${village.name}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'As', id: 'vector.labels.as' })}:
                        <span>${village.as}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Zs', id: 'vector.labels.zs' })}:
                        <span>${village.zs}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}:
                        <span>${village.latitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}:
                        <span>${village.longitude}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Cas positifs', id: 'vector.labels.nr_positive_cases' })}:
                        <span>${village.nr_positive_cases}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Population', id: 'vector.labels.population' })}:
                        <span>${village.population}</span>
                    </div>
                    <div>
                        ${formatMessage({ defaultMessage: 'Source GPS', id: 'vector.labels.gps_source' })}:
                        <span>${village.gps_source}</span>
                    </div>
                </section>`;
    }

    render() {
        return <div ref={(node) => { this.mapNode = node; }} className="map-container" />;
    }
}

VectorMapComponent.defaultProps = {
};

VectorMapComponent.propTypes = {
    selectMarker: PropTypes.func.isRequired,
    baseLayer: PropTypes.string.isRequired,
    overlays: PropTypes.object.isRequired,
    traps: PropTypes.arrayOf(PropTypes.object).isRequired,
    targets: PropTypes.arrayOf(PropTypes.object).isRequired,
    villages: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
};

export default injectIntl(VectorMapComponent);
