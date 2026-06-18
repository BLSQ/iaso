import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

import { useAppId } from '../../../../../hooks/useAppId';
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
    appId: string,
    countryId?: string,
    isEmbedded = false,
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
            if (isEmbedded) {
                return getRequest(
                    `${LQAS_COUNTRY_URL}${countryId}/?app_id=${appId}`,
                );
            }
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
    isEmbedded = false,
): UseQueryResult<LqasImData> => {
    const appId = useAppId();
    return useSnackQuery({
        queryKey: [type, countryId, getLqasIm, appId],
        queryFn: async () => getLqasIm(type, appId, countryId, isEmbedded),
        dispatchOnError: false,
        options: {
            select: data => {
                return data?.data;
            },
            retry: 0,
            keepPreviousData: false,
            initialData: { stats: {} },
            enabled: Boolean(countryId),
            onError: err => {
                console.warn(err);
                return undefined;
            },
        },
    });
};
