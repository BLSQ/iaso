import { UseQueryResult } from 'react-query';
import { getRequestImage } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import MESSAGES from '../../messages';

export const useGetProjectQRCode = (projectId?: string): UseQueryResult<String, Error> => {

    return useSnackQuery({
        queryKey: ['projectQRCode', projectId],
        queryFn: () => getRequestImage(`/api/projects/${projectId}/qr_code/`),
        snackErrorMsg: MESSAGES.qrCodeError,
        options: {
            enabled: Boolean(projectId),
            staleTime: 0,
            cacheTime: 0,
            select: (blob) => {
                return URL.createObjectURL(blob);
            }
        },
    });
};