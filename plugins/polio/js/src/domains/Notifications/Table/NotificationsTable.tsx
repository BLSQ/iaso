import React, { FunctionComponent } from 'react';

import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { handleTableDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/utils/table';

import {
    ApiNotificationsParams,
    NotificationsMetaData,
    NotificationsParams,
} from '../types';
import { NOTIFICATIONS_BASE_URL } from '../../../constants/routes';
import { useGetNotifications } from '../hooks/api';
import { useNotificationsTableColumns } from './useNotificationsTableColumns';

type Props = {
    params: NotificationsParams;
    notificationsMetaData: NotificationsMetaData;
};

export const NotificationsTable: FunctionComponent<Props> = ({
    params,
    notificationsMetaData,
}) => {
    const apiParams: ApiNotificationsParams = {
        ...params,
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    const { data, isFetching } = useGetNotifications(apiParams);
    const columns = useNotificationsTableColumns(notificationsMetaData);
    return (
        <TableWithDeepLink
            baseUrl={NOTIFICATIONS_BASE_URL}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            columns={columns}
            count={data?.count ?? 0}
            params={params}
            onTableParamsChange={handleTableDeepLink(NOTIFICATIONS_BASE_URL)}
            extraProps={{ loading: isFetching }}
            columnSelectorEnabled
            columnSelectorButtonType="button"
        />
    );
};
