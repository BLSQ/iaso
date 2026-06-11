import { UseMutationResult } from 'react-query';
import { useDeleteTableRow } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { deleteRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

const deleteAttachment = (id: number) =>
    deleteRequest(`/api/formattachments/${id}`);

export const useDeleteAttachment = (
    params: Record<string, any>,
    count: number,
): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        params,
        pageKey: 'attachmentsPage',
        pageSizeKey: 'attachmentsPageSize',
        count,
        invalidateQueries: ['formAttachments'],
        baseUrl: baseUrls.formDetail,
    });
    return useSnackMutation({
        mutationFn: deleteAttachment,
        options: { onSuccess },
    });
};
