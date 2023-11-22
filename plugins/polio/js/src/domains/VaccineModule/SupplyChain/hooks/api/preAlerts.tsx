/* eslint-disable camelcase */
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { apiUrl } from '../../constants';

export const useGetPreAlertDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_pre_alerts/`),
        queryKey: ['preAlertDetails', vrfId],
        options: {
            enabled: Boolean(vrfId),
            select: data => {
                if (!data) return data;
                return {
                    pre_alerts: data.pre_alerts.map(pre_alert => {
                        return {
                            ...pre_alert,
                            lot_number: pre_alert.lot_numbers.join(', '),
                        };
                    }),
                };
            },
        },
    });
};
