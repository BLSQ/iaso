import React, { FC, useCallback, useMemo, useRef } from 'react';
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
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import { usePlanningAssignments } from '../api/usePlanningAssignments';
import { ClearAssignmentsBelowDialog } from '../assign/ClearAssignmentsBelowDialog';
import { useAssignOnClick } from '../assign/useAssignOnClick';
import { useSelectedTeamArea } from '../assign/useSelectedTeamArea';
import {
    ASSIGNABLE_ORG_UNITS_HOVER_LAYER_IDS,
    AssignableOrgUnitsLayer,
} from './AssignableOrgUnitsLayer';
import { ClickableOrgUnits } from './ClickableOrgUnits';
import { MapHint } from './MapHint';
import { MapLegend } from './MapLegend';
import { OrgUnitHover } from './OrgUnitHover';
import { ScopeAreaLayer } from './ScopeAreaLayer';
import { useAssignments } from './useAssignments';
import { OrgUnitFeatureCollection, useLevelGeometry } from './useLevelGeometry';
import {
    countOrgUnitsOffMap,
    getAssigneeColorByOrgUnitId,
    getTeamIdByOrgUnitId,
} from './utils';

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

const filterFeatures = <T extends FeatureCollection>(
    collection: T,
    ids: Set<number>,
): T => ({
    ...collection,
    features: collection.features.filter(feature =>
        ids.has(Number(feature.id)),
    ),
});

const INITIAL_VIEW_STATE = {
    longitude: defaultCenter.lng,
    latitude: defaultCenter.lat,
    zoom: 3,
};

// The selected team's level is outlined, its members' level is filled with their assignee's color.
export const AssignmentsMap: FC = () => {
    const { planning, tree, selectedTeam, selectedLevel } =
        useAssignmentsContext();
    const showPoints = selectedTeam.type === TeamType.enum.TEAM_OF_USERS;
    const { area, members, membersPresence, isFetching } =
        useLevelGeometry(selectedLevel);
    const { openTeam, onlyUnassigned, focusOrgUnitId, mode } = useAssignmentsParams();
    const focusedOrgUnitId = focusOrgUnitId
        ? Number(focusOrgUnitId)
        : undefined;
    const isAssignMode = mode === 'assign';
    const { data: assignments } = usePlanningAssignments(planning.id);
    const {
        assignableOrgUnitIds,
        toggleAssignment,
        pendingChange,
        cancelPendingChange,
    } = useAssignOnClick();
    const colorByOrgUnitId = useMemo(
        () => getAssigneeColorByOrgUnitId(tree, assignments ?? []),
        [tree, assignments],
    );
    const teamIdByOrgUnitId = useMemo(
        () => getTeamIdByOrgUnitId(assignments ?? []),
        [assignments],
    );
    // The found org unit once its team's geometry is loaded, the team's area otherwise.
    const focusedFeature = useMemo(
        () => findFeature([members, area], focusedOrgUnitId),
        [members, area, focusedOrgUnitId],
    );
    const orgUnitIdsOpeningTeam = useMemo(
        () => new Set(teamIdByOrgUnitId.keys()),
        [teamIdByOrgUnitId],
    );
    const openTeamOfOrgUnit = useCallback(
        (orgUnitId: number) => {
            const teamId = teamIdByOrgUnitId.get(orgUnitId);
            if (teamId) openTeam(teamId);
        },
        [teamIdByOrgUnitId, openTeam],
    );
    const areaBounds = useMemo(() => area && getGeoJsonBounds(area), [area]);
    const fitBounds = useMemo(
        () => (focusedFeature ? getGeoJsonBounds(focusedFeature) : areaBounds),
        [focusedFeature, areaBounds],
    );
    const fitKey = focusedFeature
        ? `${selectedTeam.id}-${focusedFeature.id}`
        : selectedTeam.id;
    const { areaOrgUnitIds } = useSelectedTeamArea();
    // Assign mode frames the selected team's own area: the org units its members can be given.
    const shownArea = useMemo(
        () =>
            isAssignMode && area && areaOrgUnitIds?.size
                ? filterFeatures(area, areaOrgUnitIds)
                : area,
        [isAssignMode, area, areaOrgUnitIds],
    );
    const areaBounds = useMemo(
        () => shownArea && getGeoJsonBounds(shownArea),
        [shownArea],
    );

    // Created once the first area is known, then kept and refitted when selecting other teams.
    const isMapCreated = useRef(false);
    if (area) isMapCreated.current = true;

    return (
        <Box sx={styles.container}>
            {isFetching && <LoadingSpinner absolute fixed={false} />}
            {isMapCreated.current && (
                <Box sx={styles.map}>
                    <BaseMap
                        initialViewState={INITIAL_VIEW_STATE}
                        bounds={areaBounds}
                    >
                        <FitBoundsOnChange
                            bounds={fitBounds}
                            fitKey={`${selectedTeam.id}-${mode}`}
                            maxZoom={
                                focusedFeature ? FOCUS_MAX_ZOOM : undefined
                            }
                            fitInitialKey={Boolean(focusedFeature)}
                        />
                        {/* Always mounted, in this order, so the area border stays above the org units. */}
                        <AssignableOrgUnitsLayer
                            geoJson={members ?? EMPTY_FEATURE_COLLECTION}
                            colorByOrgUnitId={colorByOrgUnitId}
                            showPoints={showPoints}
                            dimAssigned={onlyUnassigned}
                            focusedOrgUnitId={focusedOrgUnitId}
                            undimmedOrgUnitIds={
                                isAssignMode ? assignableOrgUnitIds : undefined
                            }
                        />
                        <ScopeAreaLayer
                            geoJson={shownArea ?? EMPTY_FEATURE_COLLECTION}
                            focusedOrgUnitId={focusedOrgUnitId}
                        />
                        <OrgUnitHover
                            layerIds={ASSIGNABLE_ORG_UNITS_HOVER_LAYER_IDS}
                        />
                        <ClickableOrgUnits
                            layerIds={ASSIGNABLE_ORG_UNITS_HOVER_LAYER_IDS}
                            clickableOrgUnitIds={
                                isAssignMode
                                    ? assignableOrgUnitIds
                                    : orgUnitIdsOpeningTeam
                            }
                            onClick={
                                isAssignMode
                                    ? toggleAssignment
                                    : openTeamOfOrgUnit
                            }
                        />
                    </BaseMap>
                    <MapHint />
                    <MapLegend
                        offMapCount={countOrgUnitsOffMap(
                            membersPresence,
                            showPoints,
                        )}
                    />
                </Box>
            )}
            <ClearAssignmentsBelowDialog
                pendingChange={pendingChange}
                onClose={cancelPendingChange}
            />
        </Box>
    );
};
