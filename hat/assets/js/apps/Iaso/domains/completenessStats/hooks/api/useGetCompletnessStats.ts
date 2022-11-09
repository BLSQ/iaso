import { UseBaseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

const queryParamsMap = new Map([
    ['parentId', 'parent_id'],
    ['orgUnitTypeId', 'org_unit_type_id'],
    ['formId', 'form_id'],
]);

const getCompletenessStats = async (params: any) => {
    const queryParams = {};
    queryParamsMap.forEach((value, key) => {
        if (params[key]) {
            queryParams[value] = params[key];
        }
    });
    const queryString = new URLSearchParams(queryParams);
    return getRequest(`/api/completeness_stats/?${queryString}`);
};

export const useGetCompletenessStats = (params: any): UseBaseQueryResult => {
    return useSnackQuery({
        queryKey: ['completenessStats', params],
        queryFn: () => getCompletenessStats(params),
        options: {
            select: (data: any[]): any[] => {
                return data.completeness;
            },
        },
    });
};
