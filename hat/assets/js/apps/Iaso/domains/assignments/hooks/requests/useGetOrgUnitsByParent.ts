import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from '../../../../libs/utils';
import { getOrgUnitAssignation } from '../../utils';

import { AssignmentsApi } from '../../types/assigment';
import { ChildrenOrgUnits } from '../../types/orgUnit';
import { Profile } from '../../../../utils/usersUtils';
import { DropdownTeamsOptions, SubTeam, User } from '../../types/team';

type Props = {
    orgUnitParentId: number | undefined;
    baseOrgunitType: string | undefined;
    allAssignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined;
    selectedItem: SubTeam | User | undefined;
};

export const useGetOrgUnitsByParent = ({
    orgUnitParentId,
    baseOrgunitType,
    allAssignments,
    teams,
    profiles,
    currentType,
    selectedItem,
}: Props): UseQueryResult<ChildrenOrgUnits, Error> => {
    const params: Record<string, any> = {
        validation_status: 'all',
        order: 'id',
        orgUnitParentId,
        onlyDirectChildren: true,
        orgUnitTypeId: baseOrgunitType,
    };

    const url = makeUrlWithParams('/api/orgunits/', params);

    return useSnackQuery(
        ['geo_json', params, baseOrgunitType],
        () => getRequest(url),
        undefined,
        {
            enabled: Boolean(orgUnitParentId) && Boolean(baseOrgunitType),
            select: data => {
                if (data && data.orgUnits) {
                    const result: ChildrenOrgUnits = {
                        orgUnits: [],
                        orgUnitsToUpdate: [],
                    };
                    result.orgUnits = data.orgUnits.map(orgUnit => {
                        const { assignment, assignedTeam, assignedUser } =
                            getOrgUnitAssignation(
                                allAssignments,
                                orgUnit,
                                teams,
                                profiles,
                                currentType,
                            );
                        return {
                            ...orgUnit,
                            assignment,
                            assignedTeam,
                            assignedUser,
                        };
                    });

                    result.orgUnitsToUpdate = result.orgUnits
                        .filter(
                            orgUnit =>
                                orgUnit?.assignedTeam?.original.id !==
                                    selectedItem?.id &&
                                orgUnit?.assignedUser?.user_id !==
                                    selectedItem?.id,
                        )
                        .map(orgUnit => orgUnit.id);
                    return result;
                }
                return undefined;
            },
        },
    );
};
