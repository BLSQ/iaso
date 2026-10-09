import { UseMutationResult } from 'react-query';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { TeamUrlParams } from 'Iaso/domains/teams/types/team';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

import MESSAGES from '../../messages';

type useDeleteArgs = {
    params: TeamUrlParams;
    count: number;
};

export const useDeleteTeam = ({
    params,
    count,
}: useDeleteArgs): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['teamsList', 'teamsDropdown', 'team'],
        baseUrl: baseUrls.teams,
    });

    return useSnackMutation({
        mutationFn: body => deleteRequest(`/api/teams/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        options: {
            onSuccess,
        },
    });
};
