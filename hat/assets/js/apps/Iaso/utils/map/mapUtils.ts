import { Theme } from '@mui/material/styles';
import Color from 'color';
import L from 'leaflet';
import { isEqual } from 'lodash';
import isNumber from 'lodash/isNumber';
import orderBy from 'lodash/orderBy';
import { ScaleThreshold } from '../../components/LegendBuilder/types';

import { CompletenessMapStats } from '../../domains/completenessStats/types';
import {
    AssociatedOrgUnit,
    MappedOrgUnit,
} from '../../domains/orgUnits/components/orgUnitMap/OrgUnitMap/types';
import { OrgUnit } from '../../domains/orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../domains/orgUnits/types/orgunitTypes';

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
    if (!items || (items && items.length === 0)) return undefined;
    const latLngs: any[] = [];
    items.forEach(i => {
        if (isValidCoordinate(i.latitude, i.longitude)) {
            latLngs.push(L.latLng(i.latitude, i.longitude));
        } else if (isValidCoordinate(i[0], i[1])) {
            latLngs.push(L.latLng(i[0], i[1]));
        }
    });
    if (latLngs.length === 0) {
        return undefined;
    }
    try {
        const bounds = L.latLngBounds(latLngs);
        return bounds && bounds.isValid() ? bounds : undefined;
    } catch (error) {
        console.warn('Error creating lat lng bounds:', error);
        return undefined;
    }
};

export const getShapesBounds = (shapes, shapeKey = 'geo_json') => {
    if (!shapes || shapes.length === 0) {
        return undefined;
    }

    const groups: any[] = [];
    shapes.forEach(s => {
        if (s[shapeKey]) {
            try {
                const shapeGroup = new L.FeatureGroup();
                const shape = L.geoJSON(s[shapeKey]);
                shape.addTo(shapeGroup);
                groups.push(shapeGroup);
            } catch (error) {
                console.warn('Error parsing shape geo JSON:', error);
            }
        }
    });

    if (groups.length === 0) {
        return undefined;
    }

    try {
        const group = new L.FeatureGroup(groups);
        const bounds = group.getBounds();
        return bounds && bounds.isValid() ? bounds : undefined;
    } catch (error) {
        console.warn('Error getting shapes bounds:', error);
        return undefined;
    }
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
    radius = 10,
): Record<string, any> => ({
    className: 'marker-custom color circle-marker',
    pathOptions: {
        fillColor: color,
        fillOpacity: 1,
        weight: 2,
        color: Color(color).darken(0.5),
        radius,
    },
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
    extend: (bounds: Bounds) => Bounds;
    isValid: () => boolean;
};

export const getOrgUnitBounds = (
    orgUnit: OrgUnit | CompletenessMapStats,
): Bounds | undefined => {
    let bounds: Bounds | undefined;

    if (orgUnit.geo_json) {
        try {
            bounds = L.geoJSON(orgUnit.geo_json).getBounds();
            // Return undefined if the bounds are not valid
            if (!bounds || !bounds.isValid()) {
                return undefined;
            }
        } catch (error) {
            console.warn('Error parsing org unit geo JSON:', error);
            return undefined;
        }
    } else if (isNumber(orgUnit.latitude) && isNumber(orgUnit.longitude)) {
        const locations = [L.latLng(orgUnit.latitude, orgUnit.longitude)];
        bounds = L.latLngBounds(locations);
        // Return undefined if the bounds are not valid
        if (!bounds || !bounds.isValid()) {
            return undefined;
        }
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

const defaultScaleThreshold = {
    domain: [70, 90],
    range: ['red', 'orange', 'green'],
};
export const getEffectiveThreshold = (
    threshold?: ScaleThreshold,
): ScaleThreshold =>
    !threshold || isEqual(threshold, {}) ? defaultScaleThreshold : threshold;

export const hasLocation = (orgUnit: OrgUnit): boolean =>
    orgUnit.has_geo_json ||
    (orgUnit.latitude !== undefined &&
        orgUnit.longitude !== undefined &&
        orgUnit.latitude !== null &&
        orgUnit.longitude !== null);
