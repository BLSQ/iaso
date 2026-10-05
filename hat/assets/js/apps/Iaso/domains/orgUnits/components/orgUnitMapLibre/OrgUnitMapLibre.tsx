import React, { FunctionComponent, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { pink } from '@mui/material/colors';
import { useSafeIntl } from 'bluesquare-components';
import type { Feature, FeatureCollection, GeoJSON } from 'geojson';
import { MapLegend } from '../../../../components/maps/MapLegend';
import {
    GeoJsonLayer,
    MapLibreMap,
    getGeoJsonBounds,
} from '../../../../components/maps/maplibre';
import MESSAGES from '../../messages';
import { OrgUnit } from '../../types/orgUnit';
import { getAncestorWithGeojson } from '../orgUnitMap/OrgUnitMap/getAncestorWithGeojson';

// as on the leaflet map
const PARENT_COLOR = pink['300'];

// `geo_json` is typed as any GeoJSON: the API sends a FeatureCollection
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

/** The org unit's shape and location, as currently in the page state (unsaved edits included) */
const toFeatureCollection = ({
    geo_json: geoJson,
    latitude,
    longitude,
}: Partial<OrgUnit>): FeatureCollection => {
    const features: Feature[] = geoJson ? asFeatures(geoJson as GeoJSON) : [];
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

type Props = {
    orgUnit: Partial<OrgUnit>;
};

/**
 * MapLibre test tab, like the leaflet map: the org unit from the page state, over its closest ancestor
 * with a shape.
 */
export const OrgUnitMapLibre: FunctionComponent<Props> = ({ orgUnit }) => {
    const theme = useTheme();
    const { formatMessage } = useSafeIntl();
    const { geo_json: geoJson, latitude, longitude } = orgUnit;

    const current = useMemo(
        () => toFeatureCollection({ geo_json: geoJson, latitude, longitude }),
        [geoJson, latitude, longitude],
    );
    const parent = useMemo(() => {
        const ancestor = getAncestorWithGeojson(orgUnit as OrgUnit);
        return ancestor && toFeatureCollection(ancestor);
    }, [orgUnit]);
    const bounds = useMemo(
        () =>
            getGeoJsonBounds({
                type: 'FeatureCollection',
                features: [...current.features, ...(parent?.features ?? [])],
            }),
        [current, parent],
    );
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

    return (
        <MapLibreMap bounds={bounds}>
            {/* clear of the attribution control */}
            <MapLegend bottom={40} top="auto" options={legend} />
            {parent && (
                <GeoJsonLayer
                    id="parent-org-unit"
                    data={parent}
                    color={PARENT_COLOR}
                />
            )}
            <GeoJsonLayer
                id="current-org-unit"
                data={current}
                color={theme.palette.primary.main}
            />
        </MapLibreMap>
    );
};
