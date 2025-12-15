import React, { FunctionComponent } from 'react';
import { useGetPerformanceThresholds } from '../hooks/api';
import { SimpleTableWithDeepLink } from 'Iaso/components/tables/SimpleTableWithDeepLink';
import { baseUrls } from '../../../../../src/constants/urls';
import { useTableColumns } from './columns';

type Props = {
    params: Record<string, string>;
};

export const Table: FunctionComponent<Props> = ({ params }) => {
    const { data: list, isFetching } = useGetPerformanceThresholds({ params });
    const columns = useTableColumns();
    return (
        <SimpleTableWithDeepLink
            params={params}
            isFetching={isFetching}
            baseUrl={baseUrls.performanceThresholds}
            data={list}
            columns={columns}
            extraProps={{ loading: isFetching, params }}
        />
    );
};
