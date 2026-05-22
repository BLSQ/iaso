import { deleteRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const deleteNationalLogisticsPlan = (id: number) => {
    return deleteRequest(`/api/polio/country_plan/${id}/`);
};

export const useDeleteNationalLogisticsPlan = () => {
    return useSnackMutation({
        mutationFn: (id: number) => deleteNationalLogisticsPlan(id),
        invalidateQueryKey: ['national-logistics-plan'],
    });
};
