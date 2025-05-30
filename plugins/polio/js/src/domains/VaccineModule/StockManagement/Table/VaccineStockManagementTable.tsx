import React, { FunctionComponent } from 'react';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { useGetVaccineStockList } from '../hooks/api';
import { StockManagementListParams } from '../types';
import { useVaccineStockManagementTableColumns } from './useVaccineStockManagementTableColumns';

type Props = { params: StockManagementListParams };

export const VaccineStockManagementTable: FunctionComponent<Props> = ({
    params,
}) => {
    const { data, isFetching } = useGetVaccineStockList(params);
    const { vaccine_type: vaccineType } = params;

    const columns = useVaccineStockManagementTableColumns(vaccineType);
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
