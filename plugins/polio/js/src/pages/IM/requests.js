import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { IM_POC_URL, LQAS_POC_URL } from './constants.ts';

export const getLqasIm = (type, countryId) => {
    switch (type) {
        case 'imOHH':
            return getRequest(`${IM_POC_URL}?type=OHH&country_id=${countryId}`);
        case 'imIHH':
            return getRequest(`${IM_POC_URL}?type=HH&country_id=${countryId}`);
        case 'imGlobal':
            return getRequest(`${IM_POC_URL}?country_id=${countryId}`);
        case 'lqas':
            return getRequest(`${LQAS_POC_URL}?country_id=${countryId}`);
        default:
            throw new Error(
                `wrong "type" parameter, expected one of :imOHH,imIHH,imGlobal, lqas; got ${type} `,
            );
    }
};

export const useLqasIm = (type, countryId) => {
    return useSnackQuery(
        [type, countryId, getLqasIm],
        async () => getLqasIm(type, countryId),
        undefined,
        {
            select: data => {
                return data;
            },
            keepPreviousData: false,
            initialData: { stats: {} },
            enabled: Boolean(countryId),
        },
    );
};
