import { Fragment, FunctionComponent } from 'react';
import React from 'react';
import { useMemo } from 'react';
import { LoadingSpinner } from 'bluesquare-components';
import { Pane } from 'react-leaflet';
import { GeoJSON } from 'react-leaflet';
import CircleMarkerComponent from 'Iaso/components/maps/markers/CircleMarkerComponent';
import { useGetParentOrgUnits } from 'Iaso/domains/assignments/hooks/requests/useGetParentOrgUnits';
import {
    OrgUnitTypeHierarchyDropdownValue,
    OrgUnitTypeHierarchyDropdownValues,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { Planning, PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { MapToolTip } from 'Iaso/domains/registry/components/map/MapTooltip';
import { getColor } from 'Iaso/hooks/useGetColors';
import { useGetColors } from 'Iaso/hooks/useGetColors';
import {
    circleColorMarkerOptions,
    isValidCoordinate,
} from 'Iaso/utils/map/mapUtils';
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
                {queryResult?.isLoading && <LoadingSpinner />}
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
                                        eventHandlers={{
                                            click: () =>
                                                canAssign && handleClick(ou),
                                        }}
                                        style={{
                                            color,
                                            fillOpacity: 0.3,
                                            fillColor: color,
                                        }}
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
                                            ...circleColorMarkerOptions(color),
                                            radius: 12,
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
