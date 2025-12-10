import { UseMutationResult, useQueryClient } from 'react-query';
import { deleteRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';

const deleteForm = (id: number) => {
    return deleteRequest(`/api/forms/${id}/`);
};

type useDeleteArgs = {
    params: any;
    count: number;
}

export const useDeleteForm = ({params, count}: useDeleteArgs): UseMutationResult => {
    const queryClient = useQueryClient();

    console.log('DEBUG (useDeleteForm): Hook Initialized');
    console.log('DEBUG (useDeleteForm): Received Params:', params);
    console.log('DEBUG (useDeleteForm): Received Count:', count);

    const onSuccessNavigateOrInvalidate = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        baseUrl: baseUrls.forms,
    })

    return useSnackMutation({
        mutationFn: body => deleteForm(body.id),
        snackSuccessMessage: MESSAGES.formDeleted,
        options:{
            onSuccess:()=>{
                queryClient.invalidateQueries(['forms']);
                
                // 2. Run the navigation/invalidation logic calculated by useDeleteTableRow.
                // (This function will trigger the redirect to page 1).
                onSuccessNavigateOrInvalidate(); 
            }
        }
    });
};
