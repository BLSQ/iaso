/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
import { UseQueryResult } from 'react-query';
import { IM_POC_URL, LQAS_DATASTORE_URL } from './constants';
import { LqasImData } from '../../constants/types';

export type LQASIMRequestType = 'lqas' | 'imOHH' | 'imIHH' | 'imGlobal';

export const getLqasIm = (
    type: LQASIMRequestType,
    countryId: string,
): Promise<any> => {
    switch (type) {
        case 'imOHH':
            return getRequest(`${IM_POC_URL}?type=OHH&country_id=${countryId}`);
        case 'imIHH':
            return getRequest(`${IM_POC_URL}?type=HH&country_id=${countryId}`);
        case 'imGlobal':
            return getRequest(`${IM_POC_URL}?country_id=${countryId}`);
        case 'lqas':
            return getRequest(`${LQAS_DATASTORE_URL}${countryId}`);
        default:
            throw new Error(
                `wrong "type" parameter, expected one of :imOHH,imIHH,imGlobal, lqas; got ${type} `,
            );
    }
};

export const useLqasIm = (
    type: LQASIMRequestType,
    countryId: string,
): UseQueryResult<LqasImData> => {
    return useSnackQuery({
        queryKey: [type, countryId, getLqasIm],
        queryFn: async () => getLqasIm(type, countryId),
        dispatchOnError: false,
        options: {
            select: data => {
                if (type === 'lqas') {
                    return data?.data;
                }
                return data;
            },
            retry: 0,
            keepPreviousData: false,
            initialData: { stats: {} },
            enabled: Boolean(countryId),
        },
    });
};
