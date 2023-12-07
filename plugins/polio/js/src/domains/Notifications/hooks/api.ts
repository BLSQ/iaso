import {
    UseBaseQueryResult,
    UseMutationResult,
    UseQueryResult,
} from 'react-query';

import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    deleteRequest,
    getRequest,
    optionsRequest,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import {
    NotificationsApiResponse,
    ApiNotificationsParams,
    DropdownsContent,
} from '../types';

const baseUrl = '/api/polio/notifications/';

const getNotifications = async (
    params: Partial<ApiNotificationsParams>,
): Promise<NotificationsApiResponse> => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${baseUrl}?${queryString}`);
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

const deleteNotification = (notificationId: number) => {
    return deleteRequest(`${baseUrl}${notificationId}`);
};

export const useDeleteNotification = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteNotification,
    });

export const getNotificationsDropdownsContent = (): UseQueryResult<
    DropdownsContent,
    Error
> =>
    useSnackQuery({
        queryKey: ['getNotificationsDropdownsContent'],
        queryFn: () => optionsRequest(`${baseUrl}?`),
        options: {
            staleTime: 1000 * 60 * 15, // in ms
            cacheTime: 1000 * 60 * 5,
            select: data => {
                const metadata = data.actions.POST;
                const mapChoices = choices =>
                    choices.map(choice => ({
                        label: choice.display_name,
                        value: choice.value,
                    }));
                return {
                    vdpv_category: mapChoices(metadata.vdpv_category.choices),
                    source: mapChoices(metadata.source.choices),
                    country: mapChoices(metadata.country.choices),
                };
            },
        },
    });
