import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { IM_POC_URL } from './constants';

const getIM = async () => getRequest(IM_POC_URL);

export const useIM = campaign => {
    return useSnackQuery(['IMStats', getIM, campaign], getIM, undefined, {
        select: data => {
            if (!campaign) return data;
            return { ...data, stats: { [campaign]: data.stats[campaign] } };
        },
        keepPreviousData: true,
        initialData: { stats: {} },
    });
};
