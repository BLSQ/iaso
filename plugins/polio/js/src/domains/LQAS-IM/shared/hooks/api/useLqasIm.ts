import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import {
    IM_COUNTRY_URL,
    IM_GLOBAL_SLUG,
    IM_OHH_SLUG,
    IM_HH_SLUG,
} from '../../../IM/constants';
import { LQAS_COUNTRY_URL } from '../../../LQAS/constants';
import { LqasImData, LqasIMType } from '../../../types';

export const getLqasIm = (
    type: LqasIMType,
    countryId?: string,
): Promise<any> => {
    switch (type) {
        case 'imOHH':
            return getRequest(`${IM_COUNTRY_URL}${IM_OHH_SLUG}_${countryId}`);
        case 'imIHH':
            return getRequest(`${IM_COUNTRY_URL}${IM_HH_SLUG}_${countryId}`);
        case 'imGlobal':
            return getRequest(
                `${IM_COUNTRY_URL}${IM_GLOBAL_SLUG}_${countryId}`,
            );
        case 'lqas':
            return getRequest(`${LQAS_COUNTRY_URL}${countryId}/`);
        default:
            throw new Error(
                `wrong "type" parameter, expected one of :imOHH,imIHH,imGlobal, lqas; got ${type} `,
            );
    }
};

export const useLqasIm = (
    type: LqasIMType,
    countryId?: string,
): UseQueryResult<LqasImData> => {
    return useSnackQuery({
        queryKey: [type, countryId, getLqasIm],
        queryFn: async () => getLqasIm(type, countryId),
        dispatchOnError: false,
        options: {
            select: data => {
                return data?.data;
            },
            retry: 0,
            keepPreviousData: false,
            initialData: { stats: {} },
            enabled: Boolean(countryId),
        },
    });
};
