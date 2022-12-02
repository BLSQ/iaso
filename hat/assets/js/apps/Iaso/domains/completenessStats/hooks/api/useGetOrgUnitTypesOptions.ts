import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

export const useGetOrgUnitTypesOptions = () => {
    const params = {
        all: 'true',
        order: 'name',
        fields: 'name,id,depth',
    };
    const queryString = new URLSearchParams(params);

    return useSnackQuery({
        queryKey: ['orgUnitTypes', params],
        queryFn: () => getRequest(`/api/orgunittypes/?${queryString}`),
        options: {
            select: data => {
                if (!data) return [];
                return data.orgUnitTypes.map(orgUnitType => ({
                    value: orgUnitType.id,
                    label: orgUnitType.name,
                    original: orgUnitType,
                }));
            },
            cacheTime: 60000,
        },
    });
};
