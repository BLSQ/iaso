import { UseQueryResult } from 'react-query';
import { memoize } from 'lodash';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';

type DropDownOption = {
    value: number;
    label: string;
    original: any;
};
const apiToDropDown = data => {
    if (!data) return [];
    return data.map(orgUnitType => ({
        value: orgUnitType.id,
        label: orgUnitType.name,
        original: orgUnitType,
    }));
};

export const useGetOrgUnitTypesOptions = (
    rootOrgUnitId?: number,
): UseQueryResult<DropDownOption[]> => {
    const params = {
        org_unit_id: rootOrgUnitId,
        version_id: ':default',
    };

    const url = makeUrlWithParams(
        '/api/v2/completeness_stats/types_for_version_ou/',
        params,
    );

    return useSnackQuery({
        queryKey: ['orgUnitTypes', params],
        queryFn: () => getRequest(url),
        options: {
            select: memoize(apiToDropDown),
            cacheTime: 60000,
        },
    });
};
