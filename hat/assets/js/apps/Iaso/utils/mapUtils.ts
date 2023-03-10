/* eslint-disable class-methods-use-this */
// @ts-ignore
import L from 'leaflet';
import Color from 'color';
import orderBy from 'lodash/orderBy';
import { injectIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { MapControl, withLeaflet } from 'react-leaflet';
import { Theme } from '@material-ui/core/styles';
import { ZoomBar } from '../components/leaflet/zoom-bar';
import { OrgUnit } from '../domains/orgUnits/types/orgUnit';
import { OrgunitTypes } from '../domains/orgUnits/types/orgunitTypes';
import {
    AssociatedOrgUnit,
    MappedOrgUnit,
} from '../domains/orgUnits/components/orgUnitMap/OrgUnitMap/types';

export const defaultCenter = [5, 20];
export const defaultZoom = 4;

export const orderOrgUnitsByDepth = (orgUnits: OrgUnit[]): OrgUnit[] =>
    orderBy(orgUnits, [o => o.org_unit_type_depth], ['asc']);
export const orderOrgUnitTypeByDepth = (
    orgUnitTypes: OrgunitTypes,
): OrgunitTypes => orderBy(orgUnitTypes, [o => o.depth], ['asc']);

export const MESSAGES = defineMessages({
    'fit-to-bounds': {
        defaultMessage: 'Center the map',
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

export const isValidCoordinate = (
    latitude: number,
    longitude: number,
): boolean => {
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
    const latLngs: any[] = [];
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

export const getShapesBounds = (shapes, shapeKey = 'geo_json') => {
    const groups: any[] = [];
    shapes.forEach(s => {
        const shapeGroup = new L.FeatureGroup();
        const shape = L.geoJSON(s[shapeKey]);
        shape.addTo(shapeGroup);
        groups.push(shapeGroup);
    });
    const group = new L.FeatureGroup(groups);
    return group.getBounds();
};

export const clusterCustomMarker = (cluster, color = 'primary') =>
    L.divIcon({
        html: `<div><span>${cluster.getChildCount()}</span></div>`,
        className: `marker-cluster ${color} default`,
        iconSize: L.point(34, 34, true),
        iconAnchor: [17, 17],
    });

export const colorClusterCustomMarker = (cluster, backgroundColor, size = 34) =>
    L.divIcon({
        html:
            `<div style="background-color: ${backgroundColor};" >` +
            `<div class="border" style="background-color: ${Color(
                backgroundColor,
            ).darken(0.5)};"></div>` +
            `<span>${cluster.getChildCount()}</span>` +
            '</div>',
        className: 'marker-cluster color',
        iconSize: L.point(size, size, true),
        iconAnchor: [size / 2, size / 2],
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

export const circleColorMarkerOptions = (
    color: string,
): Record<string, string | number> => ({
    className: 'marker-custom color circle-marker',
    fillColor: color,
    fillOpacity: 1,
    weight: 2,
    color: Color(color).darken(0.5),
    radius: 8,
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

// Takes the value of the .orgUnit field of each org unit and copy it in either shape or location field
export const mapOrgUnitByLocation = (
    origin: OrgunitTypes | AssociatedOrgUnit[],
): MappedOrgUnit[] => {
    const mappedOrgunits: MappedOrgUnit[] = [];
    origin.forEach(element => {
        const copy = {
            ...element,
            orgUnits: {
                shapes: [],
                locations: [],
            },
        };
        element.orgUnits.forEach(o => {
            if (o.latitude && o.longitude) {
                copy.orgUnits.locations.push(o);
            }
            if (o.geo_json) {
                copy.orgUnits.shapes.push(o);
            }
        });
        mappedOrgunits.push(copy);
    });
    return mappedOrgunits;
};

export const shapeOptions = (): {
    // eslint-disable-next-line no-unused-vars
    onEachFeature: (feature: any, layer: any) => void;
} => ({
    onEachFeature: (feature, layer) => {
        layer.setStyle({
            weight: 3,
        });
    },
});

type ShapeOptions = {
    shapeOptions: { color: string; className: string; pane: string };
};
export const polygonDrawOption = (
    customClass = 'primary',
    extraClass = '',
    theme: Theme,
): ShapeOptions => {
    return {
        shapeOptions: {
            color: theme.palette[customClass].main,
            className: `${customClass} ${extraClass}`,
            pane: 'custom-shape-draw',
        },
    };
};

export const getleafletGeoJson = (geoJson: any): void =>
    geoJson ? L.geoJson(geoJson, shapeOptions) : null;
