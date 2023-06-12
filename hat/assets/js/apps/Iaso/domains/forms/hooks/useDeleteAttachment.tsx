import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { baseUrls } from '../../../constants/urls';
import { useDeleteTableRow } from '../../../components/tables/TableWithDeepLink';

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
