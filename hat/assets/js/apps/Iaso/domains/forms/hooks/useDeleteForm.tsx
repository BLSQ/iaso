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

    const onSuccessNavigateOrInvalidate = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['forms'],
        baseUrl: baseUrls.forms,
    })

    return useSnackMutation({
        mutationFn: body => deleteForm(body.id),
        snackSuccessMessage: MESSAGES.formDeleted,
        options:{
            onSuccess:()=>{
                onSuccessNavigateOrInvalidate(); 
            }
        }
    });
};
