import React, { FunctionComponent } from 'react';

import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { baseUrls } from '../../../../constants/urls';

import { ChronogramTasksParams } from '../types';
import { useChronogramDetailsTableColumn } from './useChronogramDetailsTableColumn';
import { useGetChronogramTasks } from '../api/useGetChronogramTasks';

type Props = {
    params: ChronogramTasksParams;
};

export const ChronogramDetailsTable: FunctionComponent<Props> = ({
    params,
}) => {
    const apiParams: ChronogramTasksParams = {
        ...params,
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    const { data, isFetching } = useGetChronogramTasks(apiParams);
    const columns = useChronogramDetailsTableColumn();
    return (
        <TableWithDeepLink
            baseUrl={baseUrls.chronogramDetails}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            columns={columns}
            count={data?.count ?? 0}
            params={params}
            extraProps={{ loading: isFetching }}
            columnSelectorEnabled
            columnSelectorButtonType="button"
        />
    );
};
