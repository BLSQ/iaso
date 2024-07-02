import React, { FunctionComponent } from 'react';

import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { ChronogramTaskMetaData, ChronogramParams } from '../types';
import { baseUrls } from '../../../constants/urls';
import { useChronogramTableColumns } from './useChronogramTableColumns';
import { useGetChronogram } from '../api/useGetChronogram';

type Props = {
    params: ChronogramParams;
    chronogramTaskMetaData: ChronogramTaskMetaData;
};

export const ChronogramTable: FunctionComponent<Props> = ({
    params,
    chronogramTaskMetaData,
}) => {
    const apiParams: ChronogramParams = {
        ...params,
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    const { data, isFetching } = useGetChronogram(apiParams);
    const columns = useChronogramTableColumns(chronogramTaskMetaData);
    return (
        <TableWithDeepLink
            baseUrl={baseUrls.chronogram}
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
