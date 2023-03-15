import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { memoize } from 'lodash';
import { UseQueryResult } from 'react-query';

type DropDownOption = {
    value: number;
    label: string;
    orignal: any;
};
const apiToDropDown = data => {
    if (!data) return [];
    return data.map(orgUnitType => ({
        value: orgUnitType.id,
        label: orgUnitType.name,
        original: orgUnitType,
    }));
};

export const useGetOrgUnitTypesOptions: (
    number?,
) => UseQueryResult<DropDownOption[]> = rootOrgUnitId => {
    const params = {
        org_unit_id: rootOrgUnitId,
        version_id: ':default',
    };
    const filteredParams = Object.entries(params).filter(
        // eslint-disable-next-line no-unused-vars
        ([_key, value]) => value !== undefined,
    );
    const queryString = new URLSearchParams(filteredParams);

    return useSnackQuery({
        queryKey: ['orgUnitTypes', params],
        queryFn: () =>
            getRequest(
                `/api/v2/completeness_stats/types_for_version_ou/?${queryString}`,
            ),
        options: {
            select: memoize(apiToDropDown),
            cacheTime: 60000,
        },
    });
};
