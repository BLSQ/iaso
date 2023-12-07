import {
    UseBaseQueryResult,
    UseMutationResult,
    useQueryClient,
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
    patchRequest,
    postRequest,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import {
    NotificationsApiResponse,
    ApiNotificationsParams,
    DropdownsContent,
    NotificationsApiData,
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
        queryKey: ['notificationsList', cleanedParams],
        queryFn: () => getNotifications(cleanedParams),
    });
};

const deleteNotification = (notificationId: number) => {
    return deleteRequest(`${baseUrl}${notificationId}`);
};

export const useDeleteNotification = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteNotification,
        invalidateQueryKey: 'notificationsList',
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

const createEditNotification = (body: NotificationsApiData) => {
    if (body.id) {
        return patchRequest(`${baseUrl}${body.id}/`, body);
    }
    return postRequest(baseUrl, body);
};

export const useCreateEditNotification = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body => createEditNotification(body),
        options: {
            onSuccess: () => {
                queryClient.invalidateQueries('notificationsList');
            },
        },
    });
};
