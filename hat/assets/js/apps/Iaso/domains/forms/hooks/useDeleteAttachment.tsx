import { UseMutationResult, useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import { deleteRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

const deleteAttachment = (id: number) =>
    deleteRequest(`/api/formattachments/${id}`);

export const useDeleteAttachment = (
    params: any,
    count: number,
): UseMutationResult => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { attachmentsPage, attachmentsPageSize } = params;
    const onSuccess = () => {
        const page = parseInt(attachmentsPage, 10);
        const pageSize = parseInt(attachmentsPageSize, 10);
        const newCount = count - 1;
        if (newCount / pageSize > 1) {
            const newParams = {
                ...params,
                attachmentsPage: `${page - 1}`,
            };
            dispatch(redirectToReplace(baseUrls.formDetail, newParams));
        }
        queryClient.invalidateQueries(['formAttachments']);
    };
    return useSnackMutation({
        mutationFn: deleteAttachment,
        options: { onSuccess },
        // invalidateQueryKey: ['formAttachments'],
    });
};
