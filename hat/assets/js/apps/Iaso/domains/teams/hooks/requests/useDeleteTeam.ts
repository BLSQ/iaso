import { UseMutationResult, useQueryClient } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import MESSAGES from '../../messages';
import { Team } from '../../types/team';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';

type useDeleteArgs = {
    params: any;
    count: number;
}

export const useDeleteTeam = ({params, count}: useDeleteArgs): UseMutationResult => {
    const onSuccessRedirect = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['teamsList'],
        baseUrl: baseUrls.teams,
    })

    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body => deleteRequest(`/api/teams/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        options: {
            onSuccess: (data, variables: Team) => {
                onSuccessRedirect();
            
                queryClient.invalidateQueries(['team', `team-${variables.id}`]);
            },
        },
    });
};
