import L from 'leaflet';
import Color from 'color';
import orderBy from 'lodash/orderBy';
import isNumber from 'lodash/isNumber';
import { Theme } from '@material-ui/core/styles';
import { OrgUnit } from '../../domains/orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../domains/orgUnits/types/orgunitTypes';
import {
    AssociatedOrgUnit,
    MappedOrgUnit,
} from '../../domains/orgUnits/components/orgUnitMap/OrgUnitMap/types';
import { CompletenessMapStats } from '../../domains/completenessStats/types';

export const defaultCenter = [5, 20];
export const defaultZoom = 4;

export const orderOrgUnitsByDepth = (orgUnits: OrgUnit[]): OrgUnit[] =>
    orderBy(orgUnits, [o => o.org_unit_type_depth], ['asc']);
export const orderOrgUnitTypeByDepth = (
    orgUnitTypes: OrgunitTypes,
): OrgunitTypes => orderBy(orgUnitTypes, [o => o.depth], ['asc']);

export const isValidCoordinate = (
    latitude?: number,
    longitude?: number,
): boolean => {
    if (
        latitude === undefined ||
        longitude === undefined ||
        latitude === null ||
        longitude === null ||
        Number.isNaN(latitude) ||
        Number.isNaN(longitude) ||
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
export const getleafletGeoJson = (geoJson: any): void =>
    geoJson ? L.geoJson(geoJson, shapeOptions) : null;

// TODO: this should be available in the new version of leaflet
type LatLng = {
    lat: number;
    lng: number;
};
export type Bounds = {
    _northEast: LatLng;
    _southWest: LatLng;
    // eslint-disable-next-line no-unused-vars
    extend: (bounds: Bounds) => Bounds;
    isValid: () => boolean;
};

export const getOrgUnitBounds = (
    orgUnit: OrgUnit | CompletenessMapStats,
): Bounds | undefined => {
    let bounds: Bounds | undefined;
    const locations: { latitude: number; longitude: number }[] = [];
    if (orgUnit.geo_json) {
        bounds = L.geoJSON(orgUnit.geo_json).getBounds();
    } else if (isNumber(orgUnit.latitude) && isNumber(orgUnit.longitude)) {
        locations.push(L.latLng(orgUnit.latitude, orgUnit.longitude));
        const locationsBounds: Bounds | undefined = L.latLngBounds(locations);
        bounds = locationsBounds;
    }
    return bounds;
};

export const getOrgUnitsBounds = (
    orgUnits: OrgUnit[] | CompletenessMapStats[],
): Bounds | undefined => {
    let bounds: Bounds | undefined;
    orgUnits.forEach((childOrgUnit: OrgUnit | CompletenessMapStats) => {
        const childrenBounds: Bounds | undefined =
            getOrgUnitBounds(childOrgUnit);
        if (bounds) {
            if (childrenBounds) {
                bounds = bounds.extend(childrenBounds);
            }
        } else if (childrenBounds) {
            bounds = childrenBounds;
        }
    });
    return bounds;
};

export const mergeBounds = (
    boundsA?: Bounds,
    boundsB?: Bounds,
): Bounds | undefined => {
    let bounds: Bounds | undefined = boundsA;
    if (bounds) {
        if (boundsB) {
            bounds = bounds.extend(boundsB);
        }
    } else if (boundsB) {
        bounds = boundsB;
    }
    return bounds;
};
