import React, { FunctionComponent } from 'react';
import { UrlParams } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { useGetPerformanceDashboard } from '../hooks/api';
import { usePerformanceDashboardColumns } from './usePerformanceDashboardColumns';

type Props = { params: Partial<UrlParams> };

export const PerformanceDashboardTable: FunctionComponent<Props> = ({
    params,
}) => {
    const { data: performanceList, isFetching } =
        useGetPerformanceDashboard(params);
    const columns = usePerformanceDashboardColumns();
    return (
        <TableWithDeepLink
            data={performanceList?.results ?? []}
            count={performanceList?.count}
            pages={performanceList?.pages}
            params={params}
            columns={columns}
            baseUrl={baseUrls.performanceDashboard}
            columnSelectorEnabled
            columnSelectorButtonType="button"
            marginTop={false}
            extraProps={{
                loading: isFetching,
                params,
                defaultPageSize: 10,
            }}
        />
    );
};
