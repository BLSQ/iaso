import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useMemo,
    useState,
} from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { MapContainer, GeoJSON, Pane } from 'react-leaflet';
import { Tile } from 'Iaso/components/maps/tools/TilesSwitchControl';
import tiles from 'Iaso/constants/mapTiles';
import {
    OrgUnitTypeHierarchyDropdownValue,
    OrgUnitTypeHierarchyDropdownValues,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { SubTeam, Team, User } from 'Iaso/domains/teams/types/team';
import { Bounds, getOrgUnitsBounds } from 'Iaso/utils/map/mapUtils';
import { Planning } from '../../../plannings/types';
import {
    useGetPlanningOrgUnitsChildren,
    useGetPlanningOrgUnitsRoot,
} from '../../../teams/hooks/requests/useGetPlanningOrgUnits';
import {
    assignmentsMapStyles,
    ASSIGNMENTS_ROOT_CLASS,
    defaultHeight,
} from '../../constants/ui';
import { AssignmentsResult } from '../../types/assigment';
import { AssignmentParams } from '../../types/assigment';
import { defaultViewport, boundsOptions } from '../../utils';
import { BulkAssignDialog } from '../dialog/BulkAssignDialog';
import { MapTools } from './MapTools';
import { ParentOrgUnits } from './ParentOrgUnits';
import { TargetOrgUnits } from './TargetOrgUnits';

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
 *
 * Only **parent** layers use a zIndex range (20 slots: 210–229). All org units of the
 * same target category share a single pane zIndex regardless of type. Stack parent
 * panes with `parentShapesMin + hierarchyIndex` (index f    if target_type_ids and org_unit_type_id not in target_type_ids:
            raise ValidationError({"org_unit_type_id": [_("Org unit type is not a target type for this planning")]})rom `orgUniTypeList`).
 *
 *
 * Example hierarchy
 * -----------------
 *   Province (root)
 *     └── Zone          ← parent pane: click assigns all Aire + Centre inside Zone
 *           └── Aire    ← target shape pane (assignable)
 *                 └── Centre de santé ← target point pane (assignable)


/** @see block comment above – reserved zIndex values for future panes */
export const MAP_PANE_Z_INDEX = {
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
    selectedOrgUnitTypes: OrgUnitTypeHierarchyDropdownValue[];
    setSelectedOrgUnitTypes: Dispatch<
        SetStateAction<OrgUnitTypeHierarchyDropdownValue[]>
    >;
    selectedUser?: User;
    selectedTeam?: SubTeam;
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
    selectedOrgUnitTypes,
    setSelectedOrgUnitTypes,
    selectedUser,
    selectedTeam,
}) => {
    const { data: childrenOrgUnits, isFetching: isLoadingChildrenOrgUnits } =
        useGetPlanningOrgUnitsChildren(planningId, params);
    const { data: rootOrgUnit, isFetching: isLoadingRootOrgUnit } =
        useGetPlanningOrgUnitsRoot(planningId);

    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const [selectedParentOrgUnit, setSelectedParentOrgUnit] = useState<
        PlanningOrgUnits | undefined
    >(undefined);
    const [showBulkAssignDialog, setShowBulkAssignDialog] =
        useState<boolean>(false);

    const bounds: Bounds | undefined = useMemo(
        () =>
            childrenOrgUnits &&
            rootOrgUnit &&
            getOrgUnitsBounds([...childrenOrgUnits, rootOrgUnit]),
        [childrenOrgUnits, rootOrgUnit],
    );

    const handleClickParentOrgUnit = (orgUnit: PlanningOrgUnits) => {
        setSelectedParentOrgUnit(orgUnit);
        setShowBulkAssignDialog(true);
    };

    const handleCloseBulkAssignDialog = () => {
        setSelectedParentOrgUnit(undefined);
        setShowBulkAssignDialog(false);
    };

    const isLoading =
        isLoadingChildrenOrgUnits ||
        isLoadingRootTeam ||
        isLoadingAssignments ||
        isLoadingRootOrgUnit ||
        isSaving;
    return (
        <Box
            position="relative"
            className={
                canAssign
                    ? 'assignments-map--can-assign'
                    : 'assignments-map--cannot-assign'
            }
            sx={assignmentsMapStyles}
        >
            {showBulkAssignDialog && selectedParentOrgUnit && planning && (
                <BulkAssignDialog
                    open={showBulkAssignDialog}
                    onClose={handleCloseBulkAssignDialog}
                    selectedParentOrgUnit={selectedParentOrgUnit}
                    planning={planning}
                    selectedUser={selectedUser}
                    selectedTeam={selectedTeam}
                    orgUniTypeList={orgUniTypeList}
                />
            )}
            {isLoading && <LoadingSpinner />}
            <MapContainer
                // Keyed on the route param, not planning?.id: the latter is undefined until the
                // planning request resolves, so the key flipped undefined -> id and React tore
                // down and rebuilt the Leaflet map. When that happened while the fitOnLoad zoom
                // was still animating, _onZoomTransitionEnd ran against a destroyed map and threw
                // "Cannot read properties of undefined (reading '_leaflet_pos')". planningId is
                // available on first render and still changes between plannings.
                key={planningId}
                bounds={bounds}
                maxZoom={currentTile.maxZoom}
                style={{ height: defaultHeight }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                scrollWheelZoom={false}
                zoomControl={false}
                boundsOptions={boundsOptions}
            >
                <MapTools
                    orgUniTypeList={orgUniTypeList}
                    planning={planning}
                    selectedOrgUnitTypes={selectedOrgUnitTypes}
                    setSelectedOrgUnitTypes={setSelectedOrgUnitTypes}
                    bounds={bounds}
                    isLoading={isLoading}
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                    boundsOptions={boundsOptions}
                />
                {rootOrgUnit?.geo_json && (
                    <Pane
                        name="root-org-unit-shape"
                        style={{ zIndex: MAP_PANE_Z_INDEX.rootShape }}
                    >
                        <GeoJSON
                            key={rootOrgUnit?.id}
                            data={rootOrgUnit.geo_json}
                            style={
                                {
                                    className: ASSIGNMENTS_ROOT_CLASS,
                                } as Record<string, string>
                            }
                        >
                            <MapToolTip
                                pane="popupPane"
                                label={rootOrgUnit.name}
                            />
                        </GeoJSON>
                    </Pane>
                )}
                <ParentOrgUnits
                    orgUnitTypes={orgUniTypeList}
                    planning={planning}
                    selectedOrgUnitTypes={selectedOrgUnitTypes}
                    rootOrgUnit={rootOrgUnit}
                    canAssign={canAssign}
                    handleClick={handleClickParentOrgUnit}
                />
                <TargetOrgUnits
                    orgUnits={childrenOrgUnits}
                    canAssign={canAssign}
                    handleSaveAssignment={handleSaveAssignment}
                    planning={planning}
                    assignments={assignments}
                    selectedOrgUnitTypes={selectedOrgUnitTypes}
                    rootTeam={rootTeam}
                />
            </MapContainer>
        </Box>
    );
};
