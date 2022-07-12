import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from '../../../../libs/utils';
import { getOrgUnitAssignation } from '../../utils';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { AssignmentsApi } from '../../types/assigment';
import { Profile } from '../../../../utils/usersUtils';
import { DropdownTeamsOptions } from '../../types/team';

type Props = {
    orgUnitParentId: number | undefined;
    baseOrgunitType: string | undefined;
    allAssignments: AssignmentsApi;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined;
};

export const useGetOrgUnitsByParent = ({
    orgUnitParentId,
    baseOrgunitType,
    allAssignments,
    teams,
    profiles,
    currentType,
}: Props): UseQueryResult<OrgUnit[], Error> => {
    const params = {
        validation_status: 'all',
        order: 'id',
        orgUnitParentId,
        onlyDirectChildren: true,
        orgUnitTypeId: baseOrgunitType,
    };

    const url = makeUrlWithParams('/api/orgunits', params);

    return useSnackQuery(
        ['geo_json', params, baseOrgunitType],
        () => getRequest(url),
        undefined,
        {
            enabled: Boolean(orgUnitParentId) && Boolean(baseOrgunitType),
            select: data => {
                if (!data || !data.orgUnits) return [];

                return data.orgUnits.map(orgUnit => {
                    const { assignment } = getOrgUnitAssignation(
                        allAssignments,
                        orgUnit,
                        teams,
                        profiles,
                        currentType,
                    );
                    return {
                        ...orgUnit,
                        assignment,
                    };
                });
            },
        },
    );
};
