import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box, useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { PotentialPaymentParams } from './types';
import { useGetPaymentLots } from './hooks/requests/useGetPaymentLots';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { redirectTo } from '../../routing/actions';
import { usePaymentLotsColumns } from './config/usePaymentLotsColumns';
import { PaymentLotsFilters } from './components/PaymentLotsFilters';

type Props = {
    params: PotentialPaymentParams;
};
const baseUrl = baseUrls.lotsPayments;
export const LotsPayments: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();

    const theme = useTheme();
    const { data, isFetching } = useGetPaymentLots(params);
    const { formatMessage } = useSafeIntl();
    const columns = usePaymentLotsColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lots)}
                displayBackButton={false}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                <PaymentLotsFilters params={params} />
                {/* @ts-ignore */}
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'created_at', desc: true }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{ loading: isFetching }}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                />
            </Box>
        </>
    );
};
