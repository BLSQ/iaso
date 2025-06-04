import React, { FunctionComponent } from 'react';

import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import { baseUrls } from '../../../../constants/urls';
import { useGetChronogram } from '../api/useGetChronogram';
import { ChronogramParams } from '../types';
import { useChronogramTableColumns } from './useChronogramTableColumns';

type Props = {
    params: ChronogramParams;
};

export const ChronogramTable: FunctionComponent<Props> = ({ params }) => {
    const apiParams: ChronogramParams = {
        ...params,
        limit: params.pageSize || '20',
        order: params.order || '-round__started_at',
        page: params.page || '1',
    };
    const { data, isFetching } = useGetChronogram(apiParams);
    const columns = useChronogramTableColumns();
    return (
        <TableWithDeepLink
            defaultSorted={[{ id: 'round__started_at', desc: true }]}
            baseUrl={baseUrls.chronogram}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            columns={columns}
            count={data?.count ?? 0}
            params={params}
            extraProps={{ loading: isFetching, defaultPageSize: 20 }}
            columnSelectorEnabled
            columnSelectorButtonType="button"
        />
    );
};
