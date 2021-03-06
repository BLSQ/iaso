import { useMutation } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useGetPreparednessData = () => {
    return useMutation(googleSheetURL =>
        sendRequest('POST', '/api/polio/campaigns/preview_preparedness/', {
            google_sheet_url: googleSheetURL,
        }),
    );
};

export const useSurgeData = () => {
    return useMutation((body, countryName) =>
        sendRequest('POST', '/api/polio/campaigns/preview_surge/', body),
    );
};