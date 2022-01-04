import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { LQAS_POC_URL } from './constants';
import { convertAPIData } from '../../utils/LqasIm.tsx';

const getLQAS = async () => getRequest(LQAS_POC_URL);

export const useLQAS = () => {
    return useSnackQuery(['LQAS', getLQAS], getLQAS, undefined, {
        keepPreviousData: true,
        initialData: { stats: {} },
    });
};

export const useConvertedLQASData = () => {
    return useSnackQuery(['LQAS', getLQAS], getLQAS, undefined, {
        select: data => {
            return convertAPIData(data);
        },
        keepPreviousData: true,
        initialData: { stats: {} },
    });
};
