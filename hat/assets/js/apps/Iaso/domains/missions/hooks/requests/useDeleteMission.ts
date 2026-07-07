import { UseMutationResult } from 'react-query';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { endpoint } from '../../constants';

const deleteMission = (id: number) => deleteRequest(`${endpoint}${id}/`);

type useDeleteArgs = {
    params?: any;
    count?: number;
};

export const useDeleteMission = ({
    params,
    count,
}: useDeleteArgs): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        count: count || 0,
        params: params || {},
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['missionsList'],
        baseUrl: baseUrls.missions,
    });

    return useSnackMutation({
        mutationFn: deleteMission,
        options: {
            onSuccess,
        },
    });
};
