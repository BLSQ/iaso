import { UseMutationResult } from 'react-query';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { deleteRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

const deleteForm = (id: number) => {
    return deleteRequest(`/api/forms/${id}/`);
};

type useDeleteArgs = {
    params: any;
    count: number;
};

export const useDeleteForm = ({
    params,
    count,
}: useDeleteArgs): UseMutationResult => {
    const onSuccessNavigateOrInvalidate = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['forms'],
        baseUrl: baseUrls.forms,
    });

    return useSnackMutation({
        mutationFn: body => deleteForm(body.id),
        snackSuccessMessage: MESSAGES.formDeleted,
        options: {
            onSuccess: () => {
                onSuccessNavigateOrInvalidate();
            },
        },
    });
};
