import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useMemo,
    useState,
} from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { MapContainer, GeoJSON, ScaleControl, Pane } from 'react-leaflet';
import { CustomTileLayer } from 'Iaso/components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from 'Iaso/components/maps/tools/CustomZoomControl';
import { Tile } from 'Iaso/components/maps/tools/TilesSwitchControl';
import tiles from 'Iaso/constants/mapTiles';
import { useGetAssignmentColor } from 'Iaso/domains/app/hooks/useGetAssignmentColor';
import {
    OrgUnitTypeHierarchyDropdownValue,
    OrgUnitTypeHierarchyDropdownValues,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { Team } from 'Iaso/domains/teams/types/team';
import {
    Bounds,
    CloseTooltipOnMoveStart,
    getOrgUnitsBounds,
} from 'Iaso/utils/map/mapUtils';
import { Planning } from '../../../plannings/types';
import {
    useGetPlanningOrgUnitsChildren,
    useGetPlanningOrgUnitsRoot,
} from '../../../teams/hooks/requests/useGetPlanningOrgUnits';
// import { parentColor } from '../constants/colors';
import { defaultHeight } from '../../constants/ui';
import { AssignmentsResult } from '../../types/assigment';
import { AssignmentParams } from '../../types/assigment';
import {
    filterOrgUnits,
    getValidShapes,
    getValidLocations,
    defaultViewport,
    boundsOptions,
    FilterOrgUnitsResult,
} from '../../utils';
import { MapLegend } from './MapLegend';
import { MapLocation } from './MapLocation';
import { MapShape } from './MapShape';

/**
 * Assignments map – layer stack & pane specification
 * ===================================================
 *
 * Vocabulary
 * ----------
 * - **Root org unit**: the planning's anchor org unit (`rootOrgUnit`). Always rendered
 *   as a polygon shape. Provides geographic context only; not an assignment target.
 * - **Target org unit types**: types listed on the planning (`target_org_unit_type_details`)
 *   and toggled in the map legend (`selectedOrgUnitType`). Org units of these types are
 *   assignable directly (single click → one assignment).
 * - **Parent org unit types**: intermediate types in the hierarchy between the root and
 *   the targets (e.g. Province → **Zone** → Aire → Centre de santé, with targets Aire
 *   and Centre). Not assignable as a single unit; **clicking a parent assigns all target
 *   descendants** contained inside it (bulk assign).
 *
 * Geometry rules
 * --------------
 * - A target org unit is rendered as a **shape** when it has `geo_json`, otherwise as a
 *   **point** when it has valid `latitude` / `longitude`.
 * - **Shapes are always drawn below points** so markers remain clickable when both exist
 *   at the same location.
 * - Within the same geometry kind (shape or point), **assigned** layers are drawn above
 *   **unassigned** layers (higher opacity / stronger visual weight).
 *
 * Z-index ladder (back → front)
 * -----------------------------
 * Leaflet default panes start around 200 (tilePane). We reserve a contiguous block for
 * assignments layers. Higher number = closer to the user (receives clicks first).
 *
 * | zIndex | Pane name                              | Content                                      | Click behaviour                          |
 * |--------|----------------------------------------|----------------------------------------------|------------------------------------------|
 * | 200    | `root-org-unit-shape`                  | Root polygon (always)                        | None (context only)                      |
 * | 210–229| `parent-org-units-shapes`              | Parent polygons (one GeoJSON per parent OU)  | Bulk-assign all targets inside polygon   |
 * |        | (offset by hierarchy index, see below) | Filter: type ∉ targets, has `geo_json`       |                                          |
 * | 230    | `target-org-units-shapes-unassigned`   | Target polygons, not yet assigned            | Assign this org unit                     |
 * | 231    | `target-org-units-shapes-assigned`     | Target polygons, already assigned            | Assign / reassign this org unit          |
 * | 240    | `target-org-units-points-unassigned`   | Target circle markers, not yet assigned      | Assign this org unit                     |
 * | 241    | `target-org-units-points-assigned`     | Target circle markers, already assigned      | Assign / reassign this org unit          |
 *
 * Org unit type hierarchy order (not `depth`)
 * -------------------------------------------
 * Type ordering comes from the hierarchy tree (`sub_unit_types`), flattened in
 * `index.tsx` via `flattenOrgUnitTypeHierarchy` → `filterOrgUnitTypesByForms`,
 * producing `orgUniTypeList` in natural tree order (parent before descendants).
 * Each entry's position is its **hierarchy index** for map drawing / parent z-index.
 * `MapLegend` reverses a copy of that list for display only. Do not use `depth`.
 *
 * Only **parent** layers use a zIndex range (20 slots: 210–229). All org units of the
 * same target category share a single pane zIndex regardless of type. Stack parent
 * panes with `parentShapesMin + hierarchyIndex` (index from `orgUniTypeList`).
 *
 * Data filtering (to implement)
 * -----------------------------
 * - **Visibility**: only org units whose `org_unit_type_id` is in `selectedOrgUnitType`
 *   (legend checkboxes) are shown as targets; parent layers show types that sit
 *   between the root and the selected targets in `orgUniTypeList` order.
 * - **Target shapes**: `has_geo_json` && type ∈ selected targets && type ∈ planning targets.
 * - **Target points**: valid lat/lng && type ∈ selected targets && no shape (or shape
 *   hidden) && type ∈ planning targets.
 * - **Parents**: `has_geo_json` && type ∉ planning targets && type is ancestor of at
 *   least one visible target org unit.
 *
 * Example hierarchy
 * -----------------
 *   Province (root)
 *     └── Zone          ← parent pane: click assigns all Aire + Centre inside Zone
 *           └── Aire    ← target shape pane (assignable)
 *                 └── Centre de santé ← target point pane (assignable)
 *
 * Current implementation status
 * -----------------------------
 * - [x] `root-org-unit-shape` (zIndex 200)
 * - [ ] `parent-org-units-shapes` (bulk assign – not implemented)
 * - [~] `target-org-units-shapes-unassigned` / `assigned` (partial: uses planning
 *       targets, not yet `selectedOrgUnitType`; no shape/point split)
 * - [~] `target-org-units-locations` (all children with coordinates; should be split
 *       into unassigned/assigned point panes above shape panes – zIndex fix pending)
 */

/** @see block comment above – reserved zIndex values for future panes */
const MAP_PANE_Z_INDEX = {
    rootShape: 200,
    /** 20-slot range for parent types ordered by `orgUniTypeList` hierarchy index */
    parentShapesMin: 210,
    parentShapesMax: 229,
    targetShapesAssigned: 230,
    targetShapesUnassigned: 231,
    targetPointsAssigned: 240,
    targetPointsUnassigned: 241,
} as const;

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
    orgUniTypeList?: OrgUnitTypeHierarchyDropdownValues;
    selectedOrgUnitType: OrgUnitTypeHierarchyDropdownValue[];
    setSelectedOrgUnitType: Dispatch<
        SetStateAction<OrgUnitTypeHierarchyDropdownValue[]>
    >;
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
    orgUniTypeList,
    selectedOrgUnitType,
    setSelectedOrgUnitType,
}) => {
    const getAssignmentColor = useGetAssignmentColor(assignments, rootTeam);

    const { data: childrenOrgUnits, isLoading: isLoadingChildrenOrgUnits } =
        useGetPlanningOrgUnitsChildren(planningId, params);
    const { data: rootOrgUnit, isLoading: isLoadingRootOrgUnit } =
        useGetPlanningOrgUnitsRoot(planningId);

    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const bounds: Bounds | undefined = useMemo(
        () =>
            childrenOrgUnits &&
            rootOrgUnit &&
            getOrgUnitsBounds([...childrenOrgUnits, rootOrgUnit]),
        [childrenOrgUnits, rootOrgUnit],
    );

    const parentOrgUnitTypes = useMemo(() => {
        return orgUniTypeList?.filter(
            ou =>
                !planning?.target_org_unit_type_details?.some(
                    t => t.id === ou.value,
                ),
        );
    }, [orgUniTypeList, planning?.target_org_unit_type_details]);

    // Fetch here org units for parent org unit types, with root org unit as parent, valid,
    // eslint-disable-next-line no-console
    console.log(parentOrgUnitTypes, 'parentOrgUnitTypes');

    const targetOrgUnitsShapes: FilterOrgUnitsResult = useMemo(
        () =>
            filterOrgUnits(
                getValidShapes(childrenOrgUnits, planning) ?? [],
                assignments,
                selectedOrgUnitType,
            ),
        [childrenOrgUnits, planning, assignments, selectedOrgUnitType],
    );

    const targetOrgUnitsLocations: FilterOrgUnitsResult = useMemo(
        () =>
            filterOrgUnits(
                getValidLocations(childrenOrgUnits) ?? [],
                assignments,
                selectedOrgUnitType,
            ),
        [childrenOrgUnits, assignments, selectedOrgUnitType],
    );

    const isLoading =
        isLoadingChildrenOrgUnits ||
        isLoadingRootTeam ||
        isLoadingAssignments ||
        isLoadingRootOrgUnit ||
        isSaving;

    return (
        <Box position="relative">
            {isLoading && <LoadingSpinner />}
            {orgUniTypeList && planning && (
                <MapLegend
                    orgUniTypeList={[...(orgUniTypeList ?? [])].reverse()}
                    selectedOrgUnitType={selectedOrgUnitType}
                    setSelectedOrgUnitType={setSelectedOrgUnitType}
                />
            )}
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
                    bounds={!isLoading ? bounds : undefined}
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
                        style={{ zIndex: MAP_PANE_Z_INDEX.rootShape }}
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
                {/* TODO: parent-org-units-shapes (MAP_PANE_Z_INDEX.parentShapes*) */}
                <Pane
                    name="target-org-units-shapes-unassigned"
                    style={{
                        zIndex: MAP_PANE_Z_INDEX.targetShapesUnassigned,
                    }}
                >
                    {targetOrgUnitsShapes.unassigned?.map(ou => (
                        <MapShape
                            key={ou.id}
                            ou={ou}
                            canAssign={canAssign}
                            handleSaveAssignment={handleSaveAssignment}
                            getAssignmentColor={getAssignmentColor}
                            opacity={0.3}
                        />
                    ))}
                </Pane>
                <Pane
                    name="target-org-units-shapes-assigned"
                    style={{
                        zIndex: MAP_PANE_Z_INDEX.targetShapesAssigned,
                    }}
                >
                    {targetOrgUnitsShapes.assigned?.map(ou => (
                        <MapShape
                            key={ou.id}
                            ou={ou}
                            canAssign={canAssign}
                            handleSaveAssignment={handleSaveAssignment}
                            getAssignmentColor={getAssignmentColor}
                        />
                    ))}
                </Pane>
                <Pane
                    name="target-org-units-points-assigned"
                    style={{
                        zIndex: MAP_PANE_Z_INDEX.targetPointsAssigned,
                    }}
                >
                    {targetOrgUnitsLocations.assigned?.map(ou => (
                        <MapLocation
                            key={ou.id}
                            ou={ou}
                            canAssign={canAssign}
                            handleSaveAssignment={handleSaveAssignment}
                            getAssignmentColor={getAssignmentColor}
                        />
                    ))}
                </Pane>
                <Pane
                    name="target-org-units-points-unassigned"
                    style={{
                        zIndex: MAP_PANE_Z_INDEX.targetPointsUnassigned,
                    }}
                >
                    {targetOrgUnitsLocations.unassigned?.map(ou => (
                        <MapLocation
                            key={ou.id}
                            ou={ou}
                            canAssign={canAssign}
                            handleSaveAssignment={handleSaveAssignment}
                            getAssignmentColor={getAssignmentColor}
                        />
                    ))}
                </Pane>
            </MapContainer>
        </Box>
    );
};
