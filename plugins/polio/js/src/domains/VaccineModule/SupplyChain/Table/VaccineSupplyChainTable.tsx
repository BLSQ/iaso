import { UrlParams } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { useGetVrfList } from '../hooks/api/vrf';
import { useVaccineSupplyChainTableColumns } from './useVaccineSupplyChainTableColumns';

type Props = { params: Partial<UrlParams> };

const getCellProps = () => ({
    style: {
        padding: '0px',
    },
});

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
            cellProps={getCellProps}
            extraProps={{
                loading: isFetching,
                params,
            }}
        />
    );
};
