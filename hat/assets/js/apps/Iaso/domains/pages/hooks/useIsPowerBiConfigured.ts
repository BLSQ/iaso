import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useIsPowerBiConfigured = (): boolean => {
    const { data } = useSnackQuery<{ available: boolean }>(
        ['iaso', 'pages', 'powerbi_available'],
        () => getRequest('/api/pages/powerbi_available/'),
    );
    return Boolean(data?.available);
};
