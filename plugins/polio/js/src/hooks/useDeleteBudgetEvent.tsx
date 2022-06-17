import {
    deleteRequest,
    restoreRequest,
} from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const deleteBudgetEvent = (id: number) =>
    deleteRequest(`/api/polio/budgetevent/${id}/`);

export const useDeleteBudgetEvent = () =>
    useSnackMutation(deleteBudgetEvent, undefined, undefined, [
        'budget-details',
    ]);

const restoreBudgetEvent = (id: number) =>
    restoreRequest(`/api/polio/budgetevent/${id}/`);

export const useRestoreBudgetEvent = () =>
    useSnackMutation(restoreBudgetEvent, undefined, undefined, [
        'budget-details',
    ]);
