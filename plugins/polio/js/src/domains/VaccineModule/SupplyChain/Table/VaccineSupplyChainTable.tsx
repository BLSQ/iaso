import React, { FunctionComponent } from 'react';
import { UrlParams } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useVaccineSupplyChainTableColumns } from './useVaccineSupplyChainTableColumns';
import { useGetVrfList } from '../hooks/api/vrf';

type Props = { params: Partial<UrlParams> };

export const VaccineSupplyChainTable: FunctionComponent<Props> = ({
    params,
}) => {
    const { data: vrfList, isFetching } = useGetVrfList(params);
    const columns = useVaccineSupplyChainTableColumns();
    return (
        <TableWithDeepLink
            data={vrfList?.results ?? []}
            count={vrfList?.count}
            pages={vrfList?.pages}
            params={params}
            columns={columns}
            baseUrl={baseUrls.vaccineSupplyChain}
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
