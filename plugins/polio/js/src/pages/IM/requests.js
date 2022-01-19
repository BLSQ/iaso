import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { IM_POC_URL, LQAS_POC_URL } from './constants.ts';
import { convertAPIData } from '../../utils/LqasIm.tsx';

export const getLqasIm = type => {
    if (type === 'imOHH') return getRequest(`${IM_POC_URL}?type=OHH`);
    if (type === 'imIHH') return getRequest(`${IM_POC_URL}?type=HH`);
    if (type === 'imGlobal') return getRequest(`${IM_POC_URL}`);
    if (type === 'lqas') return getRequest(`${LQAS_POC_URL}`);
    throw new Error(
        `wrong "type" parameter, expected one of :imOHH,imIHH,imGlobal, lqas; got ${type} `,
    );
};

export const useLqasIm = type => {
    return useSnackQuery(
        [type, getLqasIm],
        async () => getLqasIm(type),
        undefined,
        {
            select: data => {
                return data;
            },
            keepPreviousData: true,
            initialData: { stats: {} },
        },
    );
};
export const useConvertedLqasImData = type => {
    return useSnackQuery(
        [type, getLqasIm],
        async () => getLqasIm(type),
        undefined,
        {
            select: data => {
                return convertAPIData(data);
            },
            keepPreviousData: true,
            initialData: { stats: {} },
        },
    );
};

export const useScopeAndDistrictsNotFound = (type, campaign) => {
    return useSnackQuery(
        [type, getLqasIm],
        async () => getLqasIm(type),
        undefined,
        {
            select: data => {
                if (!data.stats || !campaign || !data.stats[campaign])
                    return {};
                return {
                    [campaign]: {
                        hasScope: data.stats[campaign].has_scope,
                        districtsNotFound:
                            data.stats[campaign].districts_not_found,
                    },
                };
            },
            keepPreviousData: true,
            initialData: { stats: {} },
        },
    );
};
