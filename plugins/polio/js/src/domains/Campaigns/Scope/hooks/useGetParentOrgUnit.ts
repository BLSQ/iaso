/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';

type Parent = {
    name: string;
    id: number;
};

type OrgUnit = {
    name: string;
    id: number;
    root?: Parent;
    country_parent?: Parent;
};

const getOrgUnit = (orgUnitId: number | undefined): Promise<OrgUnit> => {
    return getRequest(`/api/polio/orgunits/${orgUnitId}/`);
};
export const useGetParentOrgUnit = (
    orgUnitId: number | undefined,
): UseQueryResult<OrgUnit, Error> => {
    const queryKey: any[] = ['polio-orgunit', orgUnitId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getOrgUnit(orgUnitId),
        options: {
            retry: false,
            staleTime: Infinity,
            enabled: Boolean(orgUnitId),
        },
    });
};
