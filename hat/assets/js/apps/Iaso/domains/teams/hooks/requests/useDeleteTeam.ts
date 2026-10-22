import { UseMutationResult } from 'react-query';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { TeamUrlParams } from 'Iaso/domains/teams/types/team';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

import { TEAM_QUERY_KEYS } from '../../constants';
import MESSAGES from '../../messages';

const deleteTeam = (teamId: number) => deleteRequest(`/api/teams/${teamId}/`);

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
        invalidateQueries: TEAM_QUERY_KEYS,
        baseUrl: baseUrls.teams,
    });

    return useSnackMutation({
        mutationFn: body => deleteTeam(body.id),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        options: {
            onSuccess,
        },
    });
};
