import { UseMutationResult } from 'react-query';

import { deleteRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import MESSAGES from '../../messages';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../../../../polio/js/src/constants/urls';

const deleteBudgetProcess = (id: number) => {
    return deleteRequest(`/api/polio/budget/${id}`);
};

type useDeleteArgs = {
    params: any;
    count: number;
}

export const useDeleteBudgetProcess = ({params, count}: useDeleteArgs): UseMutationResult =>{
    const onSuccess = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['budget'],
        baseUrl: baseUrls.budget,
    });

    return useSnackMutation({
        mutationFn: id => deleteBudgetProcess(id),
        snackSuccessMessage: MESSAGES.messageDeleteSuccess,
        options: {
            onSuccess,
        },
    });
}