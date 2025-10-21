import { UseMutationResult } from 'react-query';
import { DuplicateEntity } from 'Iaso/domains/entities/duplicates/types';
import { Selection } from 'Iaso/domains/orgUnits/types/selection';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

const apiUrl = '/api/entityduplicates/bulk_ignore/';

const ignoreDuplicate = (selection: Selection<DuplicateEntity>) => {
    return postRequest({
        url: apiUrl,
        data: {
            select_all: selection.selectAll,
            selected_ids: selection.selectedItems.map(it => it.id),
            unselected_ids: selection.unSelectedItems.map(it => it.id),
        },
    });
};

export const useBulkIgnoreDuplicate = (
    onSuccess: (data: any) => void = _data => null,
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (selection: Selection<DuplicateEntity>) =>
            ignoreDuplicate(selection),
        invalidateQueryKey: 'entityDuplicates',
        options: {
            retry: false,
            onSuccess,
        },
    });
};
