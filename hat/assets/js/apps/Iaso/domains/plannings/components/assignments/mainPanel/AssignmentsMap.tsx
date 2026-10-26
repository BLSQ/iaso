import React, { FC, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { FeatureCollection } from 'geojson';
import { BaseMap } from 'Iaso/components/maps/maplibre/BaseMap';
import { FitBoundsOnChange } from 'Iaso/components/maps/maplibre/FitBoundsOnChange';
import { getGeoJsonBounds } from 'Iaso/components/maps/maplibre/utils';
import { TeamType } from 'Iaso/domains/teams/constants';
import { SxStyles } from 'Iaso/types/general';
import { defaultCenter } from 'Iaso/utils/map/mapUtils';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import {
    ASSIGNABLE_ORG_UNITS_HOVER_LAYER_IDS,
    AssignableOrgUnitsLayer,
} from './AssignableOrgUnitsLayer';
import { OrgUnitTooltip } from './OrgUnitTooltip';
import { ScopeAreaLayer } from './ScopeAreaLayer';
import { useAssignments } from './useAssignments';
import { useLevelGeometry } from './useLevelGeometry';
import { getAssigneeColorByOrgUnitId } from './utils';

const styles = {
    container: {
        position: 'relative',
        flex: 1,
        minHeight: 0,
    },
    map: {
        position: 'absolute',
        inset: 0,
    },
} satisfies SxStyles;

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
};

const INITIAL_VIEW_STATE = {
    longitude: defaultCenter.lng,
    latitude: defaultCenter.lat,
    zoom: 3,
};

// The selected team's level is outlined, its members' level is filled with their assignee's color.
export const AssignmentsMap: FC = () => {
    const { planning, tree, selectedTeam, selectedLevel } =
        useAssignmentsContext();
    const area = useLevelGeometry(selectedLevel);
    const members = useLevelGeometry(selectedLevel + 1);
    const { data: assignments } = useAssignments(`${planning.id}`);
    const colorByOrgUnitId = useMemo(
        () => getAssigneeColorByOrgUnitId(tree, assignments ?? []),
        [tree, assignments],
    );
    const areaBounds = useMemo(
        () => area.geoJson && getGeoJsonBounds(area.geoJson),
        [area.geoJson],
    );

    // Created once the first area is known, then kept and refitted when selecting other teams.
    const isMapCreated = useRef(false);
    if (area.geoJson) isMapCreated.current = true;

    return (
        <Box sx={styles.container}>
            {(area.isFetching || members.isFetching) && (
                <LoadingSpinner absolute fixed={false} />
            )}
            {isMapCreated.current && (
                <Box sx={styles.map}>
                    <BaseMap
                        initialViewState={INITIAL_VIEW_STATE}
                        bounds={areaBounds}
                    >
                        <FitBoundsOnChange
                            bounds={areaBounds}
                            fitKey={selectedTeam.id}
                        />
                        {/* Always mounted, in this order, so the area border stays above the org units. */}
                        <AssignableOrgUnitsLayer
                            geoJson={
                                members.geoJson ?? EMPTY_FEATURE_COLLECTION
                            }
                            colorByOrgUnitId={colorByOrgUnitId}
                            showPoints={
                                selectedTeam.type === TeamType.TEAM_OF_USERS
                            }
                        />
                        <ScopeAreaLayer
                            geoJson={area.geoJson ?? EMPTY_FEATURE_COLLECTION}
                        />
                        <OrgUnitTooltip
                            layerIds={ASSIGNABLE_ORG_UNITS_HOVER_LAYER_IDS}
                        />
                    </BaseMap>
                </Box>
            )}
        </Box>
    );
};
