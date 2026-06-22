import React, {
    Fragment,
    FunctionComponent,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import L from 'leaflet';
import { Pane, GeoJSON } from 'react-leaflet';
import CircleMarkerComponent from 'Iaso/components/maps/markers/CircleMarkerComponent';
import { useGetParentOrgUnits } from 'Iaso/domains/assignments/hooks/requests/useGetParentOrgUnits';
import {
    OrgUnitTypeHierarchyDropdownValue,
    OrgUnitTypeHierarchyDropdownValues,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { Planning, PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { getColor, useGetColors } from 'Iaso/hooks/useGetColors';
import {
    circleColorMarkerOptions,
    isValidCoordinate,
} from 'Iaso/utils/map/mapUtils';
import { ASSIGNMENTS_PARENT_CLASS } from '../../constants/ui';
import { MAP_PANE_Z_INDEX } from './AssignmentsMap';

type Props = {
    orgUniTypeList?: OrgUnitTypeHierarchyDropdownValues;
    planning?: Planning;
    selectedOrgUnitTypes: OrgUnitTypeHierarchyDropdownValue[];
    rootOrgUnit?: PlanningOrgUnits;
    canAssign: boolean;
    handleClick: (orgUnit: PlanningOrgUnits) => void;
};

export const ParentOrgUnits: FunctionComponent<Props> = ({
    orgUniTypeList,
    planning,
    selectedOrgUnitTypes,
    rootOrgUnit,
    handleClick,
    canAssign,
}) => {
    const canAssignRef = useRef(canAssign);
    canAssignRef.current = canAssign;
    const handleClickRef = useRef(handleClick);
    handleClickRef.current = handleClick;

    const getOnEachFeature = useCallback(
        (ou: PlanningOrgUnits) => (_feature: unknown, layer: L.Layer) => {
            layer.on('click', () => {
                if (canAssignRef.current) {
                    handleClickRef.current(ou);
                }
            });
        },
        [],
    );

    // Remove target org unit types and un checked org unit types
    // keep original index to always compute same corlo per type
    const parentOrgUnitTypes = useMemo(() => {
        return orgUniTypeList
            ?.map((ou, index) => ({
                ...ou,
                originalIndex: index,
            }))
            .filter(
                ou =>
                    !planning?.target_org_unit_type_details?.some(
                        t => t.id === ou.value,
                    ) &&
                    selectedOrgUnitTypes.some(
                        selected => selected.value === ou.value,
                    ),
            );
    }, [
        orgUniTypeList,
        planning?.target_org_unit_type_details,
        selectedOrgUnitTypes,
    ]);
    const parentOrgUnitsQueries = useGetParentOrgUnits({
        orgUniParentId: rootOrgUnit?.id,
        orgUnitTypeIds: parentOrgUnitTypes?.map(ou => ou.value),
    });

    const parentOrgUnitsLocations = useMemo(() => {
        return parentOrgUnitsQueries
            ?.map(query => {
                return query.data?.filter(ou =>
                    isValidCoordinate(ou.latitude, ou.longitude),
                );
            })
            .filter(query => Boolean(query));
    }, [parentOrgUnitsQueries]);
    const parentOrgUnitsShapes = useMemo(() => {
        return parentOrgUnitsQueries
            ?.map(query => {
                return query.data?.filter(
                    ou => ou?.has_geo_json && ou.geo_json,
                );
            })
            .filter(query => Boolean(query));
    }, [parentOrgUnitsQueries]);
    const { data: colors } = useGetColors();
    return parentOrgUnitTypes?.map((out, index) => {
        const zIndex = MAP_PANE_Z_INDEX.parentShapesMin + out.originalIndex;
        const queryResult = parentOrgUnitsQueries?.[index];
        return (
            <Fragment key={`parent-org-units-${out.value}`}>
                {parentOrgUnitsShapes.length > 0 && (
                    <Pane
                        name={`parent-org-units-shapes-${out.value}`}
                        key={`parent-org-units-shapes-${out.value}`}
                        style={{
                            zIndex,
                        }}
                    >
                        {queryResult?.data?.map(ou => {
                            const color = getColor(
                                out.originalIndex + 1,
                                colors,
                            );
                            if (ou?.has_geo_json && ou.geo_json) {
                                return (
                                    <GeoJSON
                                        key={ou.id}
                                        data={ou.geo_json}
                                        onEachFeature={getOnEachFeature(ou)}
                                        style={
                                            {
                                                color,
                                                fillOpacity: 0.3,
                                                fill: color,
                                                className:
                                                    ASSIGNMENTS_PARENT_CLASS,
                                            } as L.PathOptions & {
                                                fill: string;
                                            }
                                        }
                                    >
                                        <MapToolTip
                                            pane="popupPane"
                                            label={ou.name}
                                        />
                                    </GeoJSON>
                                );
                            }
                        })}
                    </Pane>
                )}

                {parentOrgUnitsLocations.length > 0 && (
                    <Pane
                        name={`parent-org-units-locations-${out.value}`}
                        key={`parent-org-units-locations-${out.value}`}
                        style={{
                            zIndex,
                        }}
                    >
                        {queryResult?.data?.map(ou => {
                            const color = getColor(
                                out.originalIndex + 1,
                                colors,
                            );
                            if (isValidCoordinate(ou.latitude, ou.longitude)) {
                                const markerOptions =
                                    circleColorMarkerOptions(color);
                                return (
                                    <CircleMarkerComponent
                                        key={ou.id}
                                        item={ou}
                                        onClick={() =>
                                            canAssign && handleClick(ou)
                                        }
                                        TooltipComponent={MapToolTip}
                                        tooltipProps={() => ({
                                            pane: 'popupPane',
                                            label: ou.name,
                                        })}
                                        markerProps={() => ({
                                            ...markerOptions,
                                            radius: 12,
                                            className: `${markerOptions.className} ${ASSIGNMENTS_PARENT_CLASS}`,
                                        })}
                                    />
                                );
                            }
                        })}
                    </Pane>
                )}
            </Fragment>
        );
    });
};
