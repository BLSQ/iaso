import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from '../../../../libs/utils';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';

type Props = {
    orgUnitParentId: number | undefined;
    baseOrgunitType: string | undefined;
};

export const useGetOrgUnitsByParent = ({
    orgUnitParentId,
    baseOrgunitType,
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
                return data.orgUnits;
            },
        },
    );
};
