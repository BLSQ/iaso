import L from 'leaflet';
import { defineMessages } from 'react-intl';
import moment from 'moment';
import { isCaseLocalised, formatThousand } from 'bluesquare-components';
import geoUtils from '../geo';

export const genericMap = mapNode =>
    L.map(mapNode, {
        attributionControl: false,
        zoomControl: false, // zoom control will be added manually
        scrollWheelZoom: false, // disable scroll zoom
        center: geoUtils.center,
        zoom: geoUtils.zoom,
        zoomDelta: geoUtils.zoomDelta,
        zoomSnap: geoUtils.zoomSnap,
    });

const tileOptions = { keepBuffer: 4 };
export const arcgisPattern =
    'https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{z}/{y}/{x}.jpg';
export const BASE_LAYERS = {
    blank: L.tileLayer(''),
    osm: L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        tileOptions,
    ),
    'arcgis-street': L.tileLayer(
        arcgisPattern.replace('{}', 'World_Street_Map'),
        tileOptions,
    ),
    'arcgis-satellite': L.tileLayer(
        arcgisPattern.replace('{}', 'World_Imagery'),
        { ...tileOptions, maxZoom: 16 },
    ),
    'arcgis-topo': L.tileLayer(arcgisPattern.replace('{}', 'World_Topo_Map'), {
        ...tileOptions,
        maxZoom: 17,
    }),
};

export const MESSAGES = defineMessages({
    'fit-to-bounds': {
        defaultMessage: 'Center to relevant villages',
        id: 'map.label.fitToBounds',
    },
    'box-zoom-title': {
        defaultMessage: 'Draw a square on the map to zoom in to an area',
        id: 'map.label.zoom.box',
    },
    'info-zoom-title': {
        defaultMessage: 'Current zoom level',
        id: 'map.label.zoom.info',
    },
    search: {
        defaultMessage: 'Search village',
        id: 'main.label.searchVillage',
    },
    'shape-loader': {
        defaultMessage: 'Loading shapes',
        id: 'main.label.shape-loader',
    },
    'endemic-population': {
        defaultMessage: 'Endemic population',
        id: 'main.label.endemic-population',
    },
    catch: {
        defaultMessage: 'Piège',
        id: 'locator.label.catch',
    },
    site: {
        defaultMessage: 'Site',
        id: 'main.label.site',
    },
    trap: {
        defaultMessage: 'Trap',
        id: 'main.label.trap',
    },
    sites: {
        defaultMessage: 'Sites',
        id: 'main.label.sites',
    },
    traps: {
        defaultMessage: 'Trzps',
        id: 'main.label.traps',
    },
    targets: {
        defaultMessage: 'Target',
        id: 'main.label.target',
    },
    catches: {
        defaultMessage: 'Catch',
        id: 'main.label.catch',
    },
    villages: {
        defaultMessage: 'Village',
        id: 'main.label.village',
    },
});

export const onResizeMap = (
    width,
    height,
    exportControl,
    currentMap,
    filename,
    position = 'topleft',
) => {
    const customSize = {
        width,
        height,
        className: 'A4Landscape page',
        tooltip: 'PNG',
    };
    if (exportControl) {
        currentMap.removeControl(exportControl);
    }
    const newExportControl = L.easyPrint({
        position,
        sizeModes: [customSize],
        hideControlContainer: true,
        title: 'Télécharger',
        exportOnly: true,
        filename,
    }).addTo(currentMap);
    return newExportControl;
};

export const defaultFitToBound = (
    currentMap,
    bounds,
    maxZoom,
    padding = [50, 50],
) => {
    setTimeout(() => {
        if (bounds.isValid()) {
            currentMap.fitBounds(bounds, { maxZoom, padding });
        }
        currentMap.invalidateSize();
    }, 1);
};

export const updateBaseLayer = (currentMap, baseLayer) => {
    Object.keys(BASE_LAYERS).forEach(key => {
        const layer = BASE_LAYERS[key];
        if (key === baseLayer) {
            layer.addTo(currentMap);
        } else if (currentMap.hasLayer(layer)) {
            currentMap.removeLayer(layer);
        }
    });
};

export const includeZoombar = (
    currentMap,
    component,
    withVillageSearch,
    onSearch,
    zoomBar = undefined,
) => {
    const { formatMessage } = component.props.intl;
    if (zoomBar) {
        currentMap.removeControl(zoomBar);
    }
    // The order in which the controls are added matters
    // zoom bar control
    const newZoomBar = L.control.zoombar({
        zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
        zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
        fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
        searchTitle: formatMessage(MESSAGES.search),
        fitToBounds: () => {
            component.fitToBounds();
        },
        position: 'topleft',
        withVillageSearch,
        onSearch,
    });
    newZoomBar.addTo(currentMap);
    return newZoomBar;
};

export const includeControlsInMap = (
    component,
    currentMap,
    hasLargeTooltip = false,
    withVillageSearch = false,
    onSearch = () => null,
    withZoomBar = true,
) => {
    if (withZoomBar) {
        includeZoombar(currentMap, component, withVillageSearch, onSearch);
    }
    const tempContainer = component.state.containers;

    // control to visualize warnings
    const warningControl = L.control({ position: 'topright' });
    warningControl.onAdd = () => L.DomUtil.create('div', 'hide-on-print');
    warningControl.addTo(currentMap);
    tempContainer.warning = warningControl.getContainer();

    // metric scale
    L.control
        .scale({ imperial: false, position: 'bottomright' })
        .addTo(currentMap);

    // controls to visualize the shape/marker tooltip
    const tooltipSmallControl = L.control({ position: 'bottomleft' });
    tooltipSmallControl.onAdd = () =>
        L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
    tooltipSmallControl.addTo(currentMap);
    tempContainer.tooltipSmall = tooltipSmallControl.getContainer();

    if (hasLargeTooltip) {
        const tooltipLargeControl = L.control({ position: 'bottomleft' });
        tooltipLargeControl.onAdd = () =>
            L.DomUtil.create('div', 'map__control__tooltip hide-on-print');
        tooltipLargeControl.addTo(currentMap);
        tempContainer.tooltipLarge = tooltipLargeControl.getContainer();
    }
};

// at which zoom can be displayed in map
export const zooms = {
    province: -1, // always in map
    zone: 7,
    area: 9,
    zs: 7,
    as: 9,
};

export const includeDefaultLayersInMap = component => {
    //
    // include relevant and constant layers
    //
    const tempComponent = component;
    const { map } = tempComponent;
    tempComponent.villageGroup = new L.FeatureGroup();
    map.addLayer(tempComponent.villageGroup);
    tempComponent.unselectedVillageGroup = new L.FeatureGroup();
    map.addLayer(tempComponent.unselectedVillageGroup);
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
            tempComponent.addLayerEvents(layer, feature.properties);
        },
    });

    geoUtils
        .getShape('province', tempComponent, shapes, shapeOptions, zooms, map)
        .then(shape => {
            tempComponent.state.defaultBounds = shape.getBounds();
        });

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
            geoUtils
                .getShape(type, tempComponent, shapes, shapeOptions, zooms, map)
                .then(minZoomTemp => {
                    plotOrHideLayer(minZoomTemp, type);
                });
        }
    };

    L.DomEvent.on(map, 'zoomend', () => {
        plotOrHideLayer(zooms.zone, 'zone');
        plotOrHideLayer(zooms.area, 'area');
    });
};

export const mapCasesToVillages = cases => {
    const villages = [];
    cases.forEach(c => {
        c.tests.forEach(t => {
            const tempT = {
                ...t,
            };
            let village;
            if (isCaseLocalised(c)) {
                village = {
                    ...t.village,
                    isLocalised: true,
                };
            } else {
                village = {
                    name:
                        c.location && c.location.village
                            ? c.location.village
                            : '--',
                    isLocalised: false,
                };
            }
            delete tempT.village;
            village.tests = [tempT];
            const villageExist = villages.find(v => v.id === village.id);
            if (!villageExist) {
                villages.push(village);
            } else {
                const tempTests = villageExist.tests.slice();
                tempTests.push(tempT);
                villageExist.tests = tempTests.sort((a, b) => {
                    if (moment(a.date).isBefore(moment(b.date))) {
                        return -1;
                    }
                    return 1;
                });
            }
        });
    });
    return villages;
};

export const mapCasesToTests = cases => {
    let tests = [];
    cases.forEach(c => {
        if (c.tests.length > 0) {
            tests = tests.concat(c.tests);
        }
    });
    return tests;
};

const renderTestTooltipContent = (test, formatMessage, testsMapping) =>
    `<section class="custom-popup-container">
        <div>${test.type}-${test.id}</div>
        <div class="${parseInt(test.result, 10) > 1 ? 'error-text' : ''}">
            ${formatMessage({
                defaultMessage: 'Result',
                id: 'main.label.testResult',
            })}:
            <span>${testsMapping[test.result]}</span>
        </div>
        <div>
            ${formatMessage({
                defaultMessage: 'Date',
                id: 'main.label.testDate',
            })}:
            <span>${moment(test.date).format('DD-MM-YYYY HH:mm')}</span>
        </div>
    </section>`;

const renderVillageTooltipContent = village =>
    `<section class="custom-popup-container">
        <div>
            ${village.name}
        </div>
    </section>`;

const tooltip = (content, orientation) =>
    `<div class="leaflet-tooltip custom-tooltip leaflet-tooltip-${orientation}">
        ${content}
    </div>`;

export const renderTestIcon = (test, formatMessage, testsMapping) => {
    const testTooltip = tooltip(
        renderTestTooltipContent(test, formatMessage, testsMapping),
        'left',
    );
    return L.divIcon({
        html: `<div>${testTooltip}<i class="fa fa-tint ${
            parseInt(test.result, 10) > 1 ? 'positive' : 'negative'
        }"></i></div>`,
        className: 'marker-test',
        iconSize: L.point(1, 1),
    });
};
export const renderVillageIcon = (village, formatMessage) => {
    const villageTooltip = tooltip(
        renderVillageTooltipContent(village, formatMessage),
        'right',
    );
    return L.divIcon({
        html: `<div>${villageTooltip}<i class="fa fa-home"></i></div>`,
        className: 'marker-village',
        iconSize: L.point(1, 1),
    });
};

export const isCoordInsidePolygon = ([x, y], poly) => {
    let inside = false;
    for (let ii = 0; ii < poly.getLatLngs().length; ii += 1) {
        const polyPoints = poly.getLatLngs()[ii];
        // console.log('polyPoints', polyPoints);
        for (
            let i = 0, j = polyPoints.length - 1;
            i < polyPoints.length;
            // TODO replace unary with  j = i, i += 1
            // j = i++
            j = i, i += 1
        ) {
            const xi = polyPoints[i].lat;
            const yi = polyPoints[i].lng;
            const xj = polyPoints[j].lat;
            const yj = polyPoints[j].lng;

            const intersect =
                yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
    }

    return inside;
};

export const renderVillagesPopup = (village, formatMessage) =>
    `<section class="custom-popup-container">
        <div>
            ${formatMessage({ defaultMessage: 'Nom', id: 'main.label.name' })}:
            <span>${village.name}</span>
        </div>
        <div>
            ${formatMessage({
                defaultMessage: 'Jours',
                id: 'main.label.days',
            })}:
            <span>${moment(village.original.first_test_date).format(
                'DD-MM-YYYY',
            )} - ${moment(village.original.last_test_date).format(
        'DD-MM-YYYY',
    )}</span>
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

export const renderSmallVillagesPopup = (
    village,
    formatMessage,
    displayArea = false,
    displayZone = false,
) =>
    `<section class="custom-popup-container">
        <div>
            ${formatMessage({ defaultMessage: 'Name', id: 'main.label.name' })}:
            <span class="margin-left--tiny--tiny inline-block">${
                village.name
            }</span>
        </div>
        <div>
            ID:
            <span class="margin-left--tiny--tiny inline-block"> ${
                village.id
            }</span>
        </div>
        <div>
            ${formatMessage({
                defaultMessage: 'Population',
                id: 'main.label.population',
            })}:
            <span class="margin-left--tiny--tiny inline-block"> ${
                village.population ? formatThousand(village.population) : '--'
            }</span>
        </div>
        <div>
            ${formatMessage({
                defaultMessage: 'Village type',
                id: 'main.label.village_type',
            })}:
            <span class="margin-left--tiny--tiny inline-block"> ${
                village.village_type || '--'
            }</span>
        </div>
        ${
            displayArea
                ? `
                <div>
                    ${formatMessage({
                        defaultMessage: 'Health area',
                        id: 'main.label.area',
                    })}:
                    <span class="margin-left--tiny--tiny inline-block"> ${
                        village.AS_name || '--'
                    }</span>
                </div>
            `
                : ''
        }
        ${
            displayZone
                ? `
                <div>
                    ${formatMessage({
                        defaultMessage: 'Health zone',
                        id: 'main.label.zone',
                    })}:
                    <span class="margin-left--tiny--tiny inline-block"> ${
                        village.ZS_name || '--'
                    }</span>
                </div>
            `
                : ''
        }
    </section>`;

export const drawVillageMarker = (
    mapComponent,
    location,
    color,
    featureGroup,
    displayArea = false,
    displayZone = false,
) => {
    if (location.latitude && location.longitude) {
        const { map } = mapComponent;
        const villageMarker = L.circle(
            [location.latitude, location.longitude],
            {
                color,
                fillColor: color,
                fillOpacity: 0.5,
                radius: 100,
                pane: 'custom-pane-markers',
            },
        )
            .on('click', event => {
                const popUp = event.target.getPopup();
                popUp.setContent(
                    renderSmallVillagesPopup(
                        location,
                        mapComponent.props.intl.formatMessage,
                        displayArea,
                        displayZone,
                    ),
                );
            })
            .on('mouseover', event => {
                L.DomEvent.stop(event);
                mapComponent.updateTooltipSmallVillage(location);
            })
            .bindPopup();

        villageMarker.addTo(featureGroup);
        map.addLayer(featureGroup);
    }
};
