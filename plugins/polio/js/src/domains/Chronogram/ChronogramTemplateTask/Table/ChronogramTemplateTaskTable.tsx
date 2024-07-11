import React, { FunctionComponent } from 'react';

import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { baseUrls } from '../../../../constants/urls';

import { ChronogramTemplateTaskParams } from '../types';
import { useChronogramTemplateTaskTableColumns } from './useChronogramTemplateTaskTableColumns';
import { useGetChronogramTemplateTask } from '../api/useGetChronogramTemplateTask';
import { ChronogramTaskMetaData } from '../../types';

type Props = {
    params: ChronogramTemplateTaskParams;
    chronogramTaskMetaData: ChronogramTaskMetaData;
};

export const ChronogramTemplateTaskTable: FunctionComponent<Props> = ({
    params,
    chronogramTaskMetaData,
}) => {
    const apiParams: ChronogramTemplateTaskParams = {
        ...params,
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    const { data, isFetching } = useGetChronogramTemplateTask(apiParams);
    const columns = useChronogramTemplateTaskTableColumns(
        chronogramTaskMetaData,
    );
    return (
        <TableWithDeepLink
            baseUrl={baseUrls.chronogramTemplateTask}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            columns={columns}
            count={data?.count ?? 0}
            params={params}
            extraProps={{ loading: isFetching }}
            columnSelectorEnabled={false}
            columnSelectorButtonType="button"
        />
    );
};
