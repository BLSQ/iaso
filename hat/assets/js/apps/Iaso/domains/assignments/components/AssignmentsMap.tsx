import React, { FunctionComponent, useMemo, useState } from 'react';
import { LoadingSpinner } from 'bluesquare-components';
import L from 'leaflet';
import { MapContainer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import CircleMarkerComponent from 'Iaso/components/maps/markers/CircleMarkerComponent';
import { CustomTileLayer } from 'Iaso/components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from 'Iaso/components/maps/tools/CustomZoomControl';
import { Tile } from 'Iaso/components/maps/tools/TilesSwitchControl';
import tiles from 'Iaso/constants/mapTiles';
import { useGetAssignmentColor } from 'Iaso/domains/app/hooks/useGetAssignmentColor';
import { Team } from 'Iaso/domains/teams/types/team';
import {
    Bounds,
    circleColorMarkerOptions,
    getOrgUnitsBounds,
    isValidCoordinate,
} from 'Iaso/utils/map/mapUtils';
import { useGetPlanningDetails } from '../../plannings/hooks/requests/useGetPlanningDetails';
import { Planning } from '../../plannings/types';
import {
    useGetPlanningOrgUnitsChildren,
    useGetPlanningOrgUnitsRoot,
} from '../../teams/hooks/requests/useGetPlanningOrgUnits';
import { AssignmentsResult } from '../hooks/requests/useGetAssignments';

type Props = {
    planningId: string;
    rootTeam?: Team;
    isLoadingRootTeam: boolean;
    assignments?: AssignmentsResult;
    isLoadingAssignments: boolean;
    handleSaveAssignment: (orgUnitId: number) => void;
    isSaving: boolean;
};

const defaultViewport = {
    center: L.latLng(1, 20),
    zoom: 3.25,
};
const boundsOptions: L.FitBoundsOptions = {
    padding: L.point(25, 25),
    maxZoom: 12,
};
const defaultHeight = '80vh';

export const AssignmentsMap: FunctionComponent<Props> = ({
    planningId,
    rootTeam,
    isLoadingRootTeam,
    assignments,
    isLoadingAssignments,
    handleSaveAssignment,
    isSaving,
}) => {
    const {
        data: planning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanningDetails(planningId);

    const { data: childrenOrgUnits, isLoading: isLoadingChildrenOrgUnits } =
        useGetPlanningOrgUnitsChildren(planningId);
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

    const isLoading =
        isLoadingChildrenOrgUnits ||
        isLoadingRootTeam ||
        isLoadingAssignments ||
        isLoadingRootOrgUnit ||
        isSaving;
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <MapContainer
                key={planning?.id}
                bounds={bounds}
                maxZoom={currentTile.maxZoom}
                style={{ height: defaultHeight }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                scrollWheelZoom={false}
                zoomControl={false}
                contextmenu
                boundsOptions={boundsOptions}
            >
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
                    <Pane name="root-org-unit-shape" style={{ zIndex: 200 }}>
                        <GeoJSON
                            key={rootOrgUnit?.id}
                            data={rootOrgUnit.geo_json}
                        />
                    </Pane>
                )}
                <Pane name="target-org-units-shapes" style={{ zIndex: 201 }}>
                    {childrenOrgUnits
                        ?.filter(ou => ou.has_geo_json)
                        .map(ou => (
                            <GeoJSON key={ou.id} data={ou.geo_json} />
                        ))}
                </Pane>
                <Pane name="target-org-units-locations" style={{ zIndex: 202 }}>
                    {childrenOrgUnits
                        ?.filter(ou =>
                            isValidCoordinate(ou.latitude, ou.longitude),
                        )
                        .map(ou => (
                            <CircleMarkerComponent
                                key={ou.id}
                                item={ou}
                                onClick={() => handleSaveAssignment(ou.id)}
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
        </>
    );
};
