import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box, useTheme } from '@mui/material';
import Color from 'color';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { PotentialPaymentParams } from './types';
import { useGetPaymentLots } from './hooks/requests/useGetPaymentLots';
import { usePaymentLotsColumns } from './hooks/config/usePaymentLotsColumns';
import { PaymentLotsFilters } from './components/CreatePaymentLot/PaymentLotsFilters';
import { SimpleTableWithDeepLink } from '../../components/tables/SimpleTableWithDeepLink';
import { RefreshButton } from '../../components/Buttons/RefreshButton';
import { useParamsObject } from '../../routing/hooks/useParamsObject';

const getRowProps = row => {
    if (row.original.task) {
        return {
            'data-test': 'paymentLotRow',
            sx: {
                backgroundColor: t =>
                    `${Color(t.palette.yellow.main).fade(0.7)} !important`,
                opacity: 0.5,
            },
        };
    }
    return {
        'data-test': 'paymentLotRow',
    };
};

const baseUrl = baseUrls.lotsPayments;
export const LotsPayments: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrl,
    ) as unknown as PotentialPaymentParams;
    const theme = useTheme();
    // Replaced isFetching with isLoading to avoid flicker effect when refreshing data, eg when PATCHing a payment
    const {
        data,
        isLoading,
        isFetching,
        refetch: forceRefresh,
    } = useGetPaymentLots(params);
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
                <RefreshButton
                    forceRefresh={forceRefresh}
                    withLoadingSpinner
                    disabled={isFetching}
                    isLoading={isFetching}
                />
                {/* @ts-ignore */}
                <SimpleTableWithDeepLink
                    marginTop={false}
                    data={data}
                    defaultSorted={[{ id: 'created_at', desc: true }]}
                    rowProps={getRowProps}
                    columns={columns}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{ loading: isLoading }}
                />
            </Box>
        </>
    );
};
