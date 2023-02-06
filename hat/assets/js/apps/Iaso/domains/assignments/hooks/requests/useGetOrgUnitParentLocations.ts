import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from '../../../../libs/utils';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';

import { OrgUnitShape } from '../../types/locations';

type Props = {
    orgUnitParentIds?: number[];
    baseOrgunitType: string | undefined;
};

export const useGetOrgUnitParentLocations = ({
    orgUnitParentIds,
    baseOrgunitType,
}: Props): UseQueryResult<OrgUnitShape[], Error> => {
    const params: Record<string, any> = {
        validation_status: 'VALID',
        asLocation: true,
        limit: 5000,
        order: 'id',
        orgUnitParentIds: orgUnitParentIds?.join(','),
        geography: 'shape',
        onlyDirectChildren: false,
        page: 1,
        orgUnitTypeId: baseOrgunitType,
    };

    const url = makeUrlWithParams('/api/orgunits/', params);

    return useSnackQuery(
        ['geo_json', params, baseOrgunitType],
        () => getRequest(url),
        undefined,
        {
            enabled:
                Boolean(params.orgUnitParentIds) && Boolean(baseOrgunitType),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: (orgUnits: OrgUnit[]) => {
                if (!orgUnits) {
                    return [];
                }
                return orgUnits.map(ou => ({
                    ...ou,
                    geoJson: ou.geo_json,
                }));
            },
        },
    );
};
