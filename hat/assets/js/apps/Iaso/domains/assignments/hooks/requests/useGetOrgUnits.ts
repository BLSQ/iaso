import { useCallback, useMemo } from 'react';
import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from '../../../../libs/utils';

import { OrgUnit, PaginatedOrgUnits } from '../../../orgUnits/types/orgUnit';

import { BaseLocation, Locations } from '../../types/locations';
import { Profile } from '../../../../utils/usersUtils';
import { DropdownTeamsOptions } from '../../types/team';
import { AssignmentsApi } from '../../types/assigment';

import { getOrgUnitAssignation } from '../../utils';

type MapProps = {
    orgUnits: OrgUnit[];
    orgUnitParentIds: number[];
    baseOrgunitType: string;
    assignments: AssignmentsApi;
    allAssignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined;
};

const mapLocation = ({
    orgUnits,
    orgUnitParentIds,
    baseOrgunitType,
    assignments,
    allAssignments,
    teams,
    profiles,
    currentType,
}: MapProps): Locations => {
    const locations: Locations = {
        shapes: {
            all: [],
            selected: [],
            unselected: [],
        },
        markers: {
            all: [],
            selected: [],
            unselected: [],
        },
    };
    if (!orgUnits) return locations;
    orgUnits.forEach((orgUnit: OrgUnit) => {
        const baseLocation: BaseLocation = {
            ...orgUnit,
            orgUnitTypeId: orgUnit.org_unit_type_id,
        };
        if (!orgUnitParentIds.find(ou => ou === orgUnit.id)) {
            if (parseInt(baseOrgunitType, 10) === orgUnit.org_unit_type_id) {
                if (orgUnit.geo_json) {
                    const shape = {
                        ...baseLocation,
                        geoJson: orgUnit.geo_json,
                    };
                    locations.shapes.all.push(shape);
                    const orgUnitAssignation = getOrgUnitAssignation(
                        assignments,
                        shape,
                        teams,
                        profiles,
                        currentType,
                    );
                    if (
                        orgUnitAssignation.assignedTeam &&
                        currentType === 'TEAM_OF_TEAMS'
                    ) {
                        locations.shapes.selected.push({
                            ...shape,
                            color: orgUnitAssignation.assignedTeam.color,
                        });
                    } else if (
                        orgUnitAssignation.assignedUser &&
                        currentType === 'TEAM_OF_USERS'
                    ) {
                        locations.shapes.selected.push({
                            ...shape,
                            color: orgUnitAssignation.assignedUser.color,
                        });
                    } else {
                        // check if org unit has another assignation with another main team
                        shape.otherAssignation = getOrgUnitAssignation(
                            allAssignments,
                            shape,
                            teams,
                            profiles,
                            undefined,
                        );
                        locations.shapes.unselected.push(shape);
                    }
                } else if (orgUnit.latitude && orgUnit.longitude) {
                    const marker = {
                        ...baseLocation,
                        latitude: orgUnit.latitude,
                        longitude: orgUnit.longitude,
                    };
                    locations.markers.all.push(marker);
                    const orgUnitAssignation = getOrgUnitAssignation(
                        assignments,
                        marker,
                        teams,
                        profiles,
                        currentType,
                    );
                    if (
                        orgUnitAssignation.assignedTeam &&
                        currentType === 'TEAM_OF_TEAMS'
                    ) {
                        locations.markers.selected.push({
                            ...marker,
                            color: orgUnitAssignation.assignedTeam.color,
                        });
                    } else if (
                        orgUnitAssignation.assignedUser &&
                        currentType === 'TEAM_OF_USERS'
                    ) {
                        locations.markers.selected.push({
                            ...marker,
                            color: orgUnitAssignation.assignedUser.color,
                        });
                    } else {
                        // check if org unit has another assignation with another main team
                        marker.otherAssignation = getOrgUnitAssignation(
                            allAssignments,
                            marker,
                            teams,
                            profiles,
                            undefined,
                        );
                        locations.markers.unselected.push(marker);
                    }
                }
            }
        }
    });
    return locations;
};

type Props = {
    orgUnitParentIds: number[] | undefined;
    baseOrgunitType: string | undefined;
    assignments: AssignmentsApi;
    allAssignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined;
    order?: string;
    search?: string;
};

export const useGetOrgUnits = ({
    orgUnitParentIds,
    baseOrgunitType,
    assignments,
    allAssignments,
    teams,
    profiles,
    currentType,
    order,
    search,
}: Props): UseQueryResult<Locations, Error> => {
    const params: Record<string, any> = useMemo(
        () => ({
            validation_status: 'VALID',
            asLocation: true,
            limit: 5000,
            geography: 'any',
            onlyDirectChildren: false,
            page: 1,
            withParents: true,
            order,
            orgUnitParentIds: orgUnitParentIds?.join(','),
            orgUnitTypeId: baseOrgunitType,
            search,
        }),
        [baseOrgunitType, order, orgUnitParentIds, search],
    );

    const select = useCallback(
        (orgUnits: OrgUnit[]) => {
            if (baseOrgunitType && orgUnitParentIds) {
                return mapLocation({
                    orgUnits,
                    orgUnitParentIds,
                    baseOrgunitType,
                    assignments,
                    allAssignments,
                    teams,
                    profiles,
                    currentType,
                });
            }
            return [];
        },
        [
            baseOrgunitType,
            orgUnitParentIds,
            assignments,
            allAssignments,
            teams,
            profiles,
            currentType,
        ],
    );
    return useSnackQuery({
        queryKey: ['orgUnits', params, baseOrgunitType],
        queryFn: () => getRequest(makeUrlWithParams('/api/orgunits/', params)),
        options: {
            enabled:
                Boolean(params.orgUnitParentIds) && Boolean(baseOrgunitType),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select,
        },
    });
};

type ListProps = {
    orgUnitParentIds: number[] | undefined;
    baseOrgunitType: string | undefined;
    order?: string;
    search?: string;
};

export const useGetOrgUnitsList = ({
    orgUnitParentIds,
    baseOrgunitType,
    order,
    search,
}: ListProps): UseQueryResult<OrgUnit[], Error> => {
    const params: Record<string, any> = useMemo(
        () => ({
            validation_status: 'VALID',
            limit: 5000,
            onlyDirectChildren: false,
            page: 1,
            withParents: true,
            order,
            orgUnitParentIds: orgUnitParentIds?.join(','),
            orgUnitTypeId: baseOrgunitType,
            search,
        }),
        [baseOrgunitType, order, orgUnitParentIds, search],
    );

    const select = useCallback(
        (data: PaginatedOrgUnits) => {
            if (baseOrgunitType && orgUnitParentIds) {
                const list: OrgUnit[] = [];
                data.orgunits.forEach((orgUnit: OrgUnit) => {
                    if (!orgUnitParentIds.find(ou => ou === orgUnit.id)) {
                        if (
                            parseInt(baseOrgunitType, 10) ===
                            orgUnit.org_unit_type_id
                        ) {
                            list.push(orgUnit);
                        }
                    }
                });
                return list;
            }
            return [];
        },
        [baseOrgunitType, orgUnitParentIds],
    );
    return useSnackQuery({
        queryKey: ['orgUnitsList', params, baseOrgunitType],
        queryFn: () => getRequest(makeUrlWithParams('/api/orgunits/', params)),
        options: {
            enabled:
                Boolean(params.orgUnitParentIds) && Boolean(baseOrgunitType),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select,
        },
    });
};
