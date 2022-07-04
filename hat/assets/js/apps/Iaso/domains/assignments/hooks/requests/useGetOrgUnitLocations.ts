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
            id: orgUnit.id,
            name: orgUnit.name,
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
    orgUnitParentIds: number[];
    baseOrgunitType: string | undefined;
    assignments: AssignmentsApi;
    allAssignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined;
};

export const useGetOrgUnitLocations = ({
    orgUnitParentIds,
    baseOrgunitType,
    assignments,
    allAssignments,
    teams,
    profiles,
    currentType,
}: Props): UseQueryResult<Locations, Error> => {
    const params = {
        validation_status: 'all',
        asLocation: true,
        limit: 5000,
        order: 'id',
        orgUnitParentIds: orgUnitParentIds.join(','),
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
            enabled: orgUnitParentIds?.length > 0 && Boolean(baseOrgunitType),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: (orgUnits: OrgUnit[]) => {
                if (baseOrgunitType) {
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
        },
    );
};
