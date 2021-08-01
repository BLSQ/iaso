import L from 'leaflet';
import Color from 'color';
import orderBy from 'lodash/orderBy';
import { injectIntl, theme } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { MapControl, withLeaflet } from 'react-leaflet';
import { ZoomBar } from '../components/leaflet/zoom-bar';

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
});

export const isValidCoordinate = (latitude, longitude) => {
    if (
        !latitude ||
        !longitude ||
        latitude > 90 ||
        latitude < -90 ||
        longitude > 180 ||
        longitude < -180
    )
        return false;
    return true;
};

export const getLatLngBounds = items => {
    if (!items || (items && items.length === 0)) return null;
    const latLngs = [];
    items.forEach(i => {
        if (isValidCoordinate(i.latitude, i.longitude)) {
            latLngs.push(L.latLng(i.latitude, i.longitude));
        } else if (isValidCoordinate(i[0], i[1])) {
            latLngs.push(L.latLng(i[0], i[1]));
        }
    });
    if (latLngs.length === 0) {
        return null;
    }
    const bounds = L.latLngBounds(latLngs);
    return bounds;
};

export const getShapesBounds = shapes => {
    const groups = [];
    shapes.forEach(s => {
        const shapeGroup = new L.FeatureGroup();
        const shape = L.geoJSON(s.geo_json);
        shape.addTo(shapeGroup);
        groups.push(shapeGroup);
    });
    const group = new L.FeatureGroup(groups);
    return group.getBounds();
};

export const clusterCustomMarker = (cluster, color = 'primary') =>
    L.divIcon({
        html: `<div><span>${cluster.getChildCount()}</span></div>`,
        className: `marker-cluster ${color}`,
        iconSize: L.point(40, 40, true),
        iconAnchor: [20, 30],
    });

export const colorClusterCustomMarker = (cluster, backgroundColor) =>
    L.divIcon({
        html:
            `<div style="background-color: ${backgroundColor};" >` +
            `<div class="border" style="background-color: ${Color(
                backgroundColor,
            ).darken(0.5)};"></div>` +
            `<span>${cluster.getChildCount()}</span>` +
            '</div>',
        className: 'marker-cluster color',
        iconSize: L.point(34, 34, true),
        iconAnchor: [17, 17],
        style: () => ({
            backgroundColor,
        }),
    });

const svgString =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">' +
    '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';

export const customMarkerOptions = {
    className: 'marker-custom primary',
    html: `<span class="marker_bg"></span><span>
        ${L.Util.template(svgString)}
    </span>`,
    iconSize: new L.Point(24, 34),
    popupAnchor: [-1, -28],
    iconAnchor: [12, 32],
};

export const customMarker = L.divIcon(customMarkerOptions);

export const circleColorMarkerOptions = color => ({
    className: 'marker-custom color circle-marker',
    fillColor: color,
    fillOpacity: 1,
    weight: 2,
    color: Color(color).darken(0.5),
    radius: 5,
});

class ZoomControl_ extends MapControl {
    createLeafletElement({ fitToBounds, intl: { formatMessage } }) {
        return new ZoomBar({
            zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
            zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
            fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
            fitToBounds,
            position: 'topleft',
        });
    }
}

export const ZoomControl = injectIntl(withLeaflet(ZoomControl_));

export const mapOrgUnitByLocation = orgUnits => {
    const mappedOrgunits = [];
    orgUnits.forEach(ot => {
        const otCopy = {
            ...ot,
            orgUnits: {
                shapes: [],
                locations: [],
            },
        };
        ot.orgUnits.forEach(o => {
            if (o.latitude && o.longitude) {
                otCopy.orgUnits.locations.push(o);
            }
            if (o.geo_json) {
                otCopy.orgUnits.shapes.push(o);
            }
        });
        otCopy.orgUnits.locations = orderBy(
            otCopy.orgUnits.locations,
            [o => o.org_unit_type_depth],
            ['asc'],
        );
        otCopy.orgUnits.shapes = orderBy(
            otCopy.orgUnits.shapes,
            [o => o.org_unit_type_depth],
            ['asc'],
        );
        mappedOrgunits.push(otCopy);
    });
    return mappedOrgunits;
};

export const shapeOptions = () => ({
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            weight: 3,
        });
    },
});

export const polygonDrawOption = (
    customClass = 'primary',
    extraClass = '',
) => ({
    shapeOptions: {
        color: theme.palette[customClass].main,
        className: `${customClass} ${extraClass}`,
        pane: 'custom-shape-draw',
    },
});

export const getleafletGeoJson = geoJson =>
    geoJson ? L.geoJson(geoJson, shapeOptions) : null;
