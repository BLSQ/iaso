import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { IM_POC_URL } from './constants';

const getIM = async imType => {
    // Adapt url when endpoints are ready
    if (imType === 'imOHH') return getRequest(IM_POC_URL+ '?type=OHH');
    if (imType === 'imIHH') return getRequest(IM_POC_URL+ '?type=HH');
    return getRequest(IM_POC_URL);
};

// campaign is never passed at the moment
export const useIM = imType => {
    return useSnackQuery(['IMStats', getIM, imType], getIM, undefined, {
        select: data => {
            return data;
        },
        keepPreviousData: true,
        initialData: { stats: {} },
    });
};
