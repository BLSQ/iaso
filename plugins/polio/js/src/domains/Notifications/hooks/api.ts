import { UseBaseQueryResult, UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    getRequest,
    optionsRequest,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { NotificationsApiResponse, ApiNotificationsParams } from '../types';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

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

export const useGetVdpvCategoriesDropdown = (): UseQueryResult<
    Array<DropdownOptions<number>>,
    Error
> =>
    useSnackQuery({
        queryKey: ['vdpvCategoriesOptions'],
        queryFn: () => optionsRequest(`${listUrl}?`),
        options: {
            staleTime: 0,
            cacheTime: 0,
            select: data => {
                console.log(data);
                return [];
            },
        },
    });

// staleTime: 1000 * 60 * 15, // in ms
// cacheTime: 1000 * 60 * 5,

// data?.map(
//     type =>
//         ({
//             label: type.name,
//             value: type.id,
//             original: type,
//         } || []),
// ),
