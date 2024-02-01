import React, { FunctionComponent } from 'react';
import { UrlParams } from 'bluesquare-components';
import { STOCK_MANAGEMENT_DETAILS } from '../../../../../constants/routes';
import { TableWithDeepLink } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { TabValue } from '../../types';
import { useVaccineStockManagementDetailsColumns } from './useVaccineStockManagementDetailsColumns';

type Props = {
    params: Partial<UrlParams>;
    paramsPrefix: TabValue;
    data: any;
    isFetching: boolean;
};

export const VaccineStockManagementDetailsTable: FunctionComponent<Props> = ({
    params,
    paramsPrefix,
    data,
    isFetching,
}) => {
    const columns = useVaccineStockManagementDetailsColumns();

    return (
        // @ts-ignore
        <TableWithDeepLink
            data={data?.results ?? []}
            count={data?.count}
            pages={data?.pages}
            params={params}
            paramsPrefix={paramsPrefix}
            columns={columns}
            baseUrl={STOCK_MANAGEMENT_DETAILS}
            marginTop={false}
            elevation={0}
            extraProps={{
                loading: isFetching,
                params,
                defaultPageSize: 20,
            }}
        />
    );
};
