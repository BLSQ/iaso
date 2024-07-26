import React, { FunctionComponent } from 'react';
import { UrlParams } from 'bluesquare-components';
import { baseUrls } from '../../../../../constants/urls';
import { TableWithDeepLink } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { TabValue } from '../../types';
import {
    useVaccineStockManagementDetailsColumnsUnusable,
    useVaccineStockManagementDetailsColumnsUsable,
} from './useVaccineStockManagementDetailsColumns';

type Props = {
    params: Partial<UrlParams>;
    paramsPrefix: TabValue;
    data: any;
    isFetching: boolean;
};

export const VaccineStockManagementDetailsTableUsable: FunctionComponent<
    Props
> = ({ params, paramsPrefix, data, isFetching }) => {
    const columns = useVaccineStockManagementDetailsColumnsUsable();

    return (
        <TableWithDeepLink
            data={data?.results ?? []}
            count={data?.count}
            pages={data?.pages}
            params={params}
            paramsPrefix={paramsPrefix}
            columns={columns}
            baseUrl={baseUrls.stockManagementDetails}
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

export const VaccineStockManagementDetailsTableUnusable: FunctionComponent<
    Props
> = ({ params, paramsPrefix, data, isFetching }) => {
    const columns = useVaccineStockManagementDetailsColumnsUnusable();

    return (
        <TableWithDeepLink
            data={data?.results ?? []}
            count={data?.count}
            pages={data?.pages}
            params={params}
            paramsPrefix={paramsPrefix}
            columns={columns}
            baseUrl={baseUrls.stockManagementDetails}
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
