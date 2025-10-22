import { UseMutationResult } from 'react-query';
import { DuplicatesGETParams } from 'Iaso/domains/entities/duplicates/hooks/api/useGetDuplicates';
import { DuplicateEntity } from 'Iaso/domains/entities/duplicates/types';
import { Selection } from 'Iaso/domains/orgUnits/types/selection';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { formatParams } from 'Iaso/utils/requests';

const apiUrl = '/api/entityduplicates/bulk_ignore/';

const ignoreDuplicate = (
    params: DuplicatesGETParams,
    selection: Selection<DuplicateEntity>,
) => {
    const queryString = new URLSearchParams(formatParams(params)).toString();
    return postRequest({
        url: `${apiUrl}?${queryString}`,
        data: {
            select_all: selection.selectAll,
            selected_ids: selection.selectedItems.map(it => it.id),
            unselected_ids: selection.unSelectedItems.map(it => it.id),
        },
    });
};

export const useBulkIgnoreDuplicate = (
    filters: DuplicatesGETParams,
    onSuccess: (data: any) => void = _data => null,
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (selection: Selection<DuplicateEntity>) =>
            ignoreDuplicate(filters, selection),
        invalidateQueryKey: 'entityDuplicates',
        options: {
            retry: false,
            onSuccess,
        },
    });
};
