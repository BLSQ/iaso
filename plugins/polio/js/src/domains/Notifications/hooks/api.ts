import { UseBaseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { NotificationsApiResponse, ApiNotificationsParams } from '../types';

const listUrl = '/api/polio/notifications/';

const getNotifications = async (
    params: Partial<ApiNotificationsParams>,
): Promise<NotificationsApiResponse> => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${listUrl}?${queryString}`);
};

export const useGetNotifications = (
    params: ApiNotificationsParams,
): UseBaseQueryResult<NotificationsApiResponse, unknown> => {
    // Removed params with an undefined value.
    const cleanedParams: Partial<ApiNotificationsParams> = JSON.parse(
        JSON.stringify(params),
    );
    return useSnackQuery({
        queryKey: ['notifications', cleanedParams],
        queryFn: () => getNotifications(cleanedParams),
    });
};
