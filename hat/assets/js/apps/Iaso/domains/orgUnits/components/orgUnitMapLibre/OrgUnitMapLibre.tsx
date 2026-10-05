import React, { FunctionComponent, useMemo, useState } from 'react';
import { useTheme } from '@mui/material';
import { pink } from '@mui/material/colors';
import { useSafeIntl } from 'bluesquare-components';
import type { Feature, FeatureCollection, GeoJSON } from 'geojson';
import { MapLegend } from '../../../../components/maps/MapLegend';
import {
    Bounds,
    GeoJsonLayer,
    MapLibreMap,
    getGeoJsonBounds,
} from '../../../../components/maps/maplibre';
import MESSAGES from '../../messages';
import { OrgUnit } from '../../types/orgUnit';
import { getAncestorWithGeojson } from '../orgUnitMap/OrgUnitMap/getAncestorWithGeojson';
import { ApiSwitch, OrgUnitsApi } from './ApiSwitch';
import { OrgUnitTilesLayer } from './OrgUnitTilesLayer';
import { OrgUnitV3, useOrgUnitsV3 } from './useOrgUnitsV3';

// as on the leaflet map
const PARENT_COLOR = pink['300'];
const SHAPE_STYLE = { fillOpacity: 0.3, lineWidth: 3 };
// v3 has the shapes as GeoJSON - or only frames the map for the vector tiles, which can't tell where they are
const V3_SHAPE_FIELDS = ['id', 'simplified_geom', 'latitude', 'longitude'];
const V3_EXTENT_FIELDS = ['id', 'bbox'];

type Located = {
    shape?: unknown;
    latitude?: number | null;
    longitude?: number | null;
};

// shapes are typed as any GeoJSON: v1 sends a FeatureCollection, v3 a geometry
const asFeatures = (geoJson: GeoJSON): Feature[] => {
    switch (geoJson.type) {
        case 'FeatureCollection':
            return geoJson.features;
        case 'Feature':
            return [geoJson];
        default:
            return [{ type: 'Feature', geometry: geoJson, properties: {} }];
    }
};

/** An org unit's shape and location */
const toFeatureCollection = ({
    shape,
    latitude,
    longitude,
}: Located): FeatureCollection => {
    const features: Feature[] = shape ? asFeatures(shape as GeoJSON) : [];
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude as number, latitude as number],
            },
            properties: {},
        });
    }
    return { type: 'FeatureCollection', features };
};

const fromV3 = (orgUnit?: OrgUnitV3): FeatureCollection | undefined =>
    orgUnit &&
    toFeatureCollection({ ...orgUnit, shape: orgUnit.simplified_geom });

/** The union of v3's `bbox`es */
const extentFromV3 = (orgUnits?: OrgUnitV3[]): Bounds | undefined => {
    const boxes = (orgUnits ?? []).flatMap(orgUnit =>
        orgUnit.bbox ? [orgUnit.bbox] : [],
    );
    if (boxes.length === 0) {
        return undefined;
    }
    return [
        [
            Math.min(...boxes.map(box => box[0])),
            Math.min(...boxes.map(box => box[1])),
        ],
        [
            Math.max(...boxes.map(box => box[2])),
            Math.max(...boxes.map(box => box[3])),
        ],
    ];
};

type Props = {
    orgUnit: Partial<OrgUnit>;
};

/**
 * MapLibre test tab, like the leaflet map: the org unit over its closest ancestor with a shape - which ones
 * comes from the page data, how their shapes reach the map from the API picked on the map.
 */
export const OrgUnitMapLibre: FunctionComponent<Props> = ({ orgUnit }) => {
    const theme = useTheme();
    const { formatMessage } = useSafeIntl();
    const [api, setApi] = useState<OrgUnitsApi>('v1');

    const ancestor = useMemo(
        () => getAncestorWithGeojson(orgUnit as OrgUnit),
        [orgUnit],
    );
    const ids = useMemo(
        () =>
            [orgUnit.id, ancestor?.id].filter(
                (id): id is number => id !== undefined,
            ),
        [orgUnit.id, ancestor?.id],
    );
    const { data: v3OrgUnits } = useOrgUnitsV3(
        ids,
        api === 'mvt' ? V3_EXTENT_FIELDS : V3_SHAPE_FIELDS,
        api !== 'v1',
    );

    // v1 and v3 bring GeoJSON, drawn as is; MVT tiles are fetched by the map itself
    const shapes = useMemo(() => {
        if (api === 'v1') {
            const { geo_json: shape, latitude, longitude } = orgUnit;
            return {
                current: toFeatureCollection({ shape, latitude, longitude }),
                parent:
                    ancestor &&
                    toFeatureCollection({ shape: ancestor.geo_json }),
            };
        }
        if (api === 'v3' && v3OrgUnits && orgUnit.id !== undefined) {
            return {
                current: fromV3(v3OrgUnits[orgUnit.id]),
                parent: ancestor && fromV3(v3OrgUnits[ancestor.id]),
            };
        }
        return undefined;
    }, [api, orgUnit, ancestor, v3OrgUnits]);

    const bounds = useMemo(() => {
        if (api === 'mvt') {
            return extentFromV3(v3OrgUnits && Object.values(v3OrgUnits));
        }
        const features = [shapes?.current, shapes?.parent].flatMap(
            collection => collection?.features ?? [],
        );
        return getGeoJsonBounds({ type: 'FeatureCollection', features });
    }, [api, shapes, v3OrgUnits]);

    const legend = useMemo(
        () => [
            {
                value: 'ouCurrent',
                label: formatMessage(MESSAGES.ouCurrent),
                color: theme.palette.primary.main,
            },
            {
                value: 'ouParent',
                label: formatMessage(MESSAGES.ouParent),
                color: PARENT_COLOR,
            },
        ],
        [formatMessage, theme.palette.primary.main],
    );
    const currentStyle = { ...SHAPE_STYLE, color: theme.palette.primary.main };
    const parentStyle = { ...SHAPE_STYLE, color: PARENT_COLOR };

    return (
        <MapLibreMap bounds={bounds}>
            <ApiSwitch value={api} onChange={setApi} />
            {/* clear of the attribution control */}
            <MapLegend bottom={40} top="auto" options={legend} />
            {/* each api its own layer ids: switching swaps sources, never reuses one of another type */}
            {api === 'mvt' && orgUnit.id !== undefined && (
                <>
                    {ancestor && (
                        <OrgUnitTilesLayer
                            id="mvt-parent"
                            filters={{ id: ancestor.id, fields: 'name' }}
                            {...parentStyle}
                        />
                    )}
                    <OrgUnitTilesLayer
                        id="mvt-current"
                        filters={{ id: orgUnit.id, fields: 'name' }}
                        {...currentStyle}
                    />
                </>
            )}
            {shapes?.parent && (
                <GeoJsonLayer
                    id={`${api}-parent`}
                    data={shapes.parent}
                    {...parentStyle}
                />
            )}
            {shapes?.current && (
                <GeoJsonLayer
                    id={`${api}-current`}
                    data={shapes.current}
                    {...currentStyle}
                />
            )}
        </MapLibreMap>
    );
};
