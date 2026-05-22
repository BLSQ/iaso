import { UseMutationResult } from 'react-query';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

const deleteAttachment = (id: number) =>
    deleteRequest(`/api/formpredefinedfilters/${id}`);

export const useDeletePredefinedFilter = (
    params: Record<string, any>,
    count: number,
): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        params,
        pageKey: 'formPredefinedFiltersPage',
        pageSizeKey: 'formPredefinedFiltersPageSize',
        count,
        invalidateQueries: ['formPredefinedFilters'],
        baseUrl: baseUrls.formDetail,
    });
    return useSnackMutation({
        mutationFn: deleteAttachment,
        options: { onSuccess },
    });
};
