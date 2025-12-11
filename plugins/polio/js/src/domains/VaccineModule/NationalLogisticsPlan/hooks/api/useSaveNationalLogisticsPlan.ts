import {
    postRequest,
    patchRequest,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { NationalLogisticsPlanData } from '../../types';

const saveNationalLogisticsPlan = (
    data: Partial<NationalLogisticsPlanData>,
) => {
    if (data.id) {
        return patchRequest(`/api/polio/country_plan/${data.id}/`, data);
    }
    return postRequest('/api/polio/country_plan/', data);
};

export const useSaveNationalLogisticsPlan = () => {
    return useSnackMutation({
        mutationFn: (data: Partial<NationalLogisticsPlanData>) =>
            saveNationalLogisticsPlan(data),
        invalidateQueryKey: ['national-logistics-plan'],
    });
};
