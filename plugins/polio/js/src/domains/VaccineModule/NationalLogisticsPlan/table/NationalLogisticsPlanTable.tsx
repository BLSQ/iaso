import React, { FunctionComponent } from 'react';
import { UrlParams } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { useGetNationalLogisticsPlan } from '../hooks/api';
import { useNationalLogisticsPlanColumns } from './useNationalLogisticsPlanColumns';

type Props = { params: Partial<UrlParams> };

export const NationalLogisticsPlanTable: FunctionComponent<Props> = ({
    params,
}) => {
    const { data: nationalPlansList, isFetching } =
        useGetNationalLogisticsPlan(params);
    const columns = useNationalLogisticsPlanColumns();
    return (
        <TableWithDeepLink
            data={nationalPlansList?.results ?? []}
            count={nationalPlansList?.count}
            pages={nationalPlansList?.pages}
            params={params}
            columns={columns}
            baseUrl={baseUrls.nationalLogisticsPlan}
            columnSelectorEnabled
            columnSelectorButtonType="button"
            marginTop={false}
            extraProps={{
                loading: isFetching,
                params,
                defaultPageSize: 20,
            }}
        />
    );
};
