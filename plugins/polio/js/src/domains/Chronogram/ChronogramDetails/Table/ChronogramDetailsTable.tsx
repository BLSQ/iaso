import React, { FunctionComponent } from 'react';

import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { baseUrls } from '../../../../constants/urls';

import { ChronogramTaskMetaData } from '../../types';
import { ChronogramTasksParams } from '../types';
import { useChronogramDetailsTableColumn } from './useChronogramDetailsTableColumn';
import { useGetChronogramTasks } from '../api/useGetChronogramTasks';

type Props = {
    params: ChronogramTasksParams;
    chronogramTaskMetaData: ChronogramTaskMetaData;
};

export const ChronogramDetailsTable: FunctionComponent<Props> = ({
    params,
    chronogramTaskMetaData,
}) => {
    const apiParams: ChronogramTasksParams = {
        ...params,
        limit: params.pageSize || '20',
        order: params.order || 'start_offset_in_days',
        page: params.page || '1',
    };
    const { data, isFetching } = useGetChronogramTasks(apiParams);
    const columns = useChronogramDetailsTableColumn(chronogramTaskMetaData);
    return (
        <TableWithDeepLink
            defaultSorted={[{ id: 'start_offset_in_days', desc: false }]}
            baseUrl={baseUrls.chronogramDetails}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            columns={columns}
            count={data?.count ?? 0}
            params={params}
            extraProps={{
                loading: isFetching,
                defaultPageSize: data?.limit ?? 20,
            }}
            columnSelectorEnabled
            columnSelectorButtonType="button"
        />
    );
};
