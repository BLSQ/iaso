import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from '../../../../libs/utils';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';

import { BaseLocation, Locations } from '../../types/locations';
import { Profile } from '../../../../utils/usersUtils';
import { DropdownTeamsOptions } from '../../types/team';
import { AssignmentsApi } from '../../types/assigment';

import { getOrgUnitAssignation } from '../../utils';

const mapLocation = (
    orgUnits: OrgUnit[],
    orgUnitParentId: number | undefined,
    baseOrgunitType: string,
    assignments: AssignmentsApi,
    teams: DropdownTeamsOptions[],
    profiles: Profile[],
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined,
): Locations => {
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
            id: orgUnit.id,
            name: orgUnit.name,
            orgUnitTypeId: orgUnit.org_unit_type_id,
        };
        if (orgUnitParentId !== orgUnit.id) {
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
                    if (orgUnitAssignation.assignedTeam) {
                        locations.shapes.selected.push({
                            ...shape,
                            color: orgUnitAssignation.assignedTeam.color,
                        });
                    } else {
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
                    if (orgUnitAssignation.assignedUser) {
                        locations.markers.selected.push(marker);
                    } else {
                        locations.markers.unselected.push(marker);
                    }
                }
            }
        }
    });

    return locations;
};

export const useGetOrgUnitLocations = (
    orgUnitParentId: number | undefined,
    baseOrgunitType: string | undefined,
    assignments: AssignmentsApi,
    teams: DropdownTeamsOptions[],
    profiles: Profile[],
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined,
): UseQueryResult<Locations, Error> => {
    const params = {
        validation_status: 'all',
        asLocation: true,
        limit: 5000,
        order: 'id',
        orgUnitParentId,
        geography: 'any',
        onlyDirectChildren: false,
        page: 1,
        orgUnitTypeId: baseOrgunitType,
    };

    const url = makeUrlWithParams('/api/orgunits', params);

    return useSnackQuery(
        ['geo_json', params, baseOrgunitType],
        () => getRequest(url),
        undefined,
        {
            enabled: Boolean(orgUnitParentId) && Boolean(baseOrgunitType),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: (orgUnits: OrgUnit[]) => {
                if (baseOrgunitType) {
                    return mapLocation(
                        orgUnits,
                        orgUnitParentId,
                        baseOrgunitType,
                        assignments,
                        teams,
                        profiles,
                        currentType,
                    );
                }
                return [];
            },
        },
    );
};
