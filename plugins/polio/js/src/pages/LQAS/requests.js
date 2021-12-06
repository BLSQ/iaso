import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { LQAS_POC_URL } from './constants';

const getLQAS = async () => getRequest(LQAS_POC_URL);

export const useLQAS = campaign => {
    return useSnackQuery(['LQAS', getLQAS, campaign], getLQAS, undefined, {
        select: data => {
            if (!campaign) return data;
            return { ...data, stats: { [campaign]: data.stats[campaign] } };
        },
        keepPreviousData: true,
        initialData: { stats: {} },
    });
};
