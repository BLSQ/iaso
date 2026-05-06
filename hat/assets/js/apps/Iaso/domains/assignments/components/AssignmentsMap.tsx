import React, { FunctionComponent, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import L from 'leaflet';
import { MapContainer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import CircleMarkerComponent from 'Iaso/components/maps/markers/CircleMarkerComponent';
import { CustomTileLayer } from 'Iaso/components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from 'Iaso/components/maps/tools/CustomZoomControl';
import { Tile } from 'Iaso/components/maps/tools/TilesSwitchControl';
import tiles from 'Iaso/constants/mapTiles';
import { useGetAssignmentColor } from 'Iaso/domains/app/hooks/useGetAssignmentColor';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { Team } from 'Iaso/domains/teams/types/team';
import {
    Bounds,
    circleColorMarkerOptions,
    CloseTooltipOnMoveStart,
    getOrgUnitsBounds,
    isValidCoordinate,
} from 'Iaso/utils/map/mapUtils';
import { Planning } from '../../plannings/types';
import {
    useGetPlanningOrgUnitsChildren,
    useGetPlanningOrgUnitsRoot,
} from '../../teams/hooks/requests/useGetPlanningOrgUnits';
import { parentColor } from '../constants/colors';
import { defaultHeight } from '../constants/ui';
import { AssignmentsResult } from '../hooks/requests/useGetAssignments';
import { AssignmentParams } from '../types/assigment';
type Props = {
    planningId: string;
    rootTeam?: Team;
    isLoadingRootTeam: boolean;
    assignments?: AssignmentsResult;
    isLoadingAssignments: boolean;
    handleSaveAssignment: (orgUnitId: number) => void;
    isSaving: boolean;
    canAssign: boolean;
    planning?: Planning;
    params: AssignmentParams;
};

const defaultViewport = {
    center: L.latLng(1, 20),
    zoom: 3.25,
};
const boundsOptions: L.FitBoundsOptions = {
    padding: L.point(25, 25),
    maxZoom: 12,
};

export const AssignmentsMap: FunctionComponent<Props> = ({
    planningId,
    rootTeam,
    isLoadingRootTeam,
    assignments,
    isLoadingAssignments,
    handleSaveAssignment,
    isSaving,
    canAssign,
    planning,
    params,
}) => {
    const { data: childrenOrgUnits, isLoading: isLoadingChildrenOrgUnits } =
        useGetPlanningOrgUnitsChildren(planningId, params);
    const { data: rootOrgUnit, isLoading: isLoadingRootOrgUnit } =
        useGetPlanningOrgUnitsRoot(planningId);
    const bounds: Bounds | undefined = useMemo(
        () =>
            childrenOrgUnits &&
            rootOrgUnit &&
            getOrgUnitsBounds([...childrenOrgUnits, rootOrgUnit]),
        [childrenOrgUnits, rootOrgUnit],
    );
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const getAssignmentColor = useGetAssignmentColor(assignments, rootTeam);
    const unassignedGeoJson = useMemo(() => {
        return childrenOrgUnits?.filter(
            ou =>
                ou.has_geo_json &&
                planning?.target_org_unit_type_details?.some(
                    t => t.id === ou.org_unit_type_id,
                ) &&
                !assignments?.allAssignments?.find(
                    assignment => assignment.org_unit === ou.id,
                ),
        );
    }, [
        childrenOrgUnits,
        planning?.target_org_unit_type_details,
        assignments?.allAssignments,
    ]);

    const assignedGeoJson = useMemo(() => {
        return childrenOrgUnits?.filter(
            ou =>
                ou.has_geo_json &&
                planning?.target_org_unit_type_details?.some(
                    t => t.id === ou.org_unit_type_id,
                ) &&
                assignments?.allAssignments?.find(
                    assignment => assignment.org_unit === ou.id,
                ),
        );
    }, [
        childrenOrgUnits,
        planning?.target_org_unit_type_details,
        assignments?.allAssignments,
    ]);

    const parentGeoJson = useMemo(() => {
        return childrenOrgUnits?.filter(
            ou =>
                ou.has_geo_json &&
                !planning?.target_org_unit_type_details?.some(
                    t => t.id === ou.org_unit_type_id,
                ),
        );
    }, [childrenOrgUnits, planning?.target_org_unit_type_details]);
    const isLoading =
        isLoadingChildrenOrgUnits ||
        isLoadingRootTeam ||
        isLoadingAssignments ||
        isLoadingRootOrgUnit ||
        isSaving;
    return (
        <Box position="relative">
            {isLoading && <LoadingSpinner />}
            {!isLoading && (
                <MapContainer
                    key={planning?.id}
                    bounds={bounds}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: defaultHeight }}
                    center={defaultViewport.center}
                    zoom={defaultViewport.zoom}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    boundsOptions={boundsOptions}
                >
                    <CloseTooltipOnMoveStart />
                    <CustomZoomControl
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                        fitOnLoad
                    />
                    <ScaleControl imperial={false} />
                    <CustomTileLayer
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                    {rootOrgUnit?.geo_json && (
                        <Pane
                            name="root-org-unit-shape"
                            style={{ zIndex: 200 }}
                        >
                            <GeoJSON
                                key={rootOrgUnit?.id}
                                data={rootOrgUnit.geo_json}
                            >
                                <MapToolTip
                                    pane="popupPane"
                                    label={rootOrgUnit.name}
                                />
                            </GeoJSON>
                        </Pane>
                    )}
                    <Pane
                        name="org-units-shapes-parent"
                        style={{ zIndex: 201 }}
                    >
                        {parentGeoJson?.map(ou => (
                            <GeoJSON
                                key={ou.id}
                                data={ou.geo_json}
                                style={{
                                    color: parentColor,
                                    fillOpacity: 0.3,
                                    fillColor: parentColor,
                                }}
                            >
                                <MapToolTip pane="popupPane" label={ou.name} />
                            </GeoJSON>
                        ))}
                    </Pane>
                    <Pane
                        name="target-org-units-shapes-unassigned"
                        style={{ zIndex: 202 }}
                    >
                        {unassignedGeoJson?.map(ou => (
                            <GeoJSON
                                key={ou.id}
                                eventHandlers={{
                                    click: () =>
                                        canAssign &&
                                        handleSaveAssignment(ou.id),
                                }}
                                data={ou.geo_json}
                                style={{
                                    color: getAssignmentColor(ou.id),
                                    fillOpacity: 0.3,
                                    fillColor: getAssignmentColor(ou.id),
                                }}
                            >
                                <MapToolTip pane="popupPane" label={ou.name} />
                            </GeoJSON>
                        ))}
                    </Pane>
                    <Pane
                        name="target-org-units-shapes-assigned"
                        style={{ zIndex: 203 }}
                    >
                        {assignedGeoJson?.map(ou => (
                            <GeoJSON
                                key={ou.id}
                                eventHandlers={{
                                    click: () =>
                                        canAssign &&
                                        handleSaveAssignment(ou.id),
                                }}
                                data={ou.geo_json}
                                style={{
                                    color: getAssignmentColor(ou.id),
                                    fillOpacity: 0.8,
                                    fillColor: getAssignmentColor(ou.id),
                                }}
                            >
                                <MapToolTip pane="popupPane" label={ou.name} />
                            </GeoJSON>
                        ))}
                    </Pane>
                    <Pane
                        name="target-org-units-locations"
                        style={{ zIndex: 202 }}
                    >
                        {childrenOrgUnits
                            ?.filter(ou =>
                                isValidCoordinate(ou.latitude, ou.longitude),
                            )
                            .map(ou => (
                                <CircleMarkerComponent
                                    key={ou.id}
                                    item={ou}
                                    onClick={() =>
                                        canAssign && handleSaveAssignment(ou.id)
                                    }
                                    TooltipComponent={MapToolTip}
                                    tooltipProps={() => ({
                                        pane: 'popupPane',
                                        label: ou.name,
                                    })}
                                    markerProps={() => ({
                                        ...circleColorMarkerOptions(
                                            getAssignmentColor(ou.id),
                                        ),
                                        radius: 12,
                                    })}
                                />
                            ))}
                    </Pane>
                </MapContainer>
            )}
        </Box>
    );
};
