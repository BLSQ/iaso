import React, { FunctionComponent } from 'react';
import { STOCK_MANAGEMENT } from '../../../../constants/routes';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useGetVaccineStockList } from '../hooks/api';
import { useVaccineStockManagementTableColumns } from './useVaccineStockManagementTableColumns';
import { StockManagementListParams } from '../types';

type Props = { params: StockManagementListParams };

export const VaccineStockManagementTable: FunctionComponent<Props> = ({
    params,
}) => {
    const { data, isFetching } = useGetVaccineStockList(params);

    const columns = useVaccineStockManagementTableColumns();
    return (
        // @ts-ignore
        <TableWithDeepLink
            data={data?.results ?? []}
            count={data?.count}
            pages={data?.pages}
            params={params}
            columns={columns}
            baseUrl={STOCK_MANAGEMENT}
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
