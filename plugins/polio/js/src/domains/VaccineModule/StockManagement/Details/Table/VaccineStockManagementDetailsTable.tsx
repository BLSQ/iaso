import React, { FunctionComponent } from 'react';
import { UrlParams } from 'bluesquare-components';
import { STOCK_MANAGEMENT_DETAILS } from '../../../../../constants/routes';
import { TableWithDeepLink } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { TabValue } from '../../types';
import { useVaccineStockManagementDetailsColumns } from './useVaccineStockManagementDetailsColumns';
import { USABLE_VIALS } from '../../constants';

type Props = {
    params: Partial<UrlParams>;
    paramsPrefix: TabValue;
    data: any;
    isFetching: boolean;
    tab: TabValue;
};

export const VaccineStockManagementDetailsTable: FunctionComponent<Props> = ({
    params,
    paramsPrefix,
    data,
    isFetching,
    tab = USABLE_VIALS,
}) => {
    const columns = useVaccineStockManagementDetailsColumns(tab);
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
            extraProps={{
                loading: isFetching,
                params,
                defaultPageSize: 20,
            }}
        />
    );
};
