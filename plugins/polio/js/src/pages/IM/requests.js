import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { useQueryClient } from 'react-query';
import { IM_POC_URL } from './constants';
import { convertAPIData } from '../../utils/LqasIm.tsx';

const getIM = async imType => {
    if (imType === 'imOHH') return getRequest(`${IM_POC_URL}?type=OHH`);
    if (imType === 'imIHH') return getRequest(`${IM_POC_URL}?type=HH`);
    return getRequest(IM_POC_URL);
};

export const useTest = () => {
    const queryClient = useQueryClient();
    return [
        queryClient.getQueryData(['Test2']),
        value => queryClient.setQueryData(['Test2'], value),
    ];
};

export const useIM = imType => {
    return useSnackQuery(
        ['IMStats', getIM, imType],
        async () => getIM(imType),
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
export const useConvertedIMData = imType => {
    return useSnackQuery(
        ['IMStats', getIM, imType],
        async () => getIM(imType),
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
