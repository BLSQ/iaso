import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const endpoint = '/api/polio/budgetfiles';

const getBudgetEventFiles = (eventId: number) => {
    return getRequest(`${endpoint}/?event_id=${eventId}`);
};

export const useGetBudgetEventFiles = (eventId: number) => {
    return useSnackQuery(['budget-event-details', eventId], () =>
        getBudgetEventFiles(eventId),
    );
};
