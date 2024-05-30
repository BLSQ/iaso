import React, { FunctionComponent } from 'react';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useGetVaccineStockList } from '../hooks/api';
import { useVaccineStockManagementTableColumns } from './useVaccineStockManagementTableColumns';
import { StockManagementListParams } from '../types';
import { baseUrls } from '../../../../constants/urls';

type Props = { params: StockManagementListParams };

export const VaccineStockManagementTable: FunctionComponent<Props> = ({
    params,
}) => {
    const { data, isFetching } = useGetVaccineStockList(params);

    const columns = useVaccineStockManagementTableColumns();
    return (
        <TableWithDeepLink
            data={data?.results ?? []}
            count={data?.count}
            pages={data?.pages}
            params={params}
            columns={columns}
            baseUrl={baseUrls.stockManagement}
            columnSelectorEnabled
            columnSelectorButtonType="button"
            marginTop={false}
            extraProps={{
                loading: isFetching,
                params,
            }}
        />
    );
};
