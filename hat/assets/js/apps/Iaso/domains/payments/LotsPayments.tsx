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

type Props = {
    params: PotentialPaymentParams;
};

const getRowProps = row => {
    if (
        row.original.task?.status === 'QUEUED' ||
        row.original.task?.status === 'RUNNING'
    ) {
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
export const LotsPayments: FunctionComponent<Props> = ({ params }) => {
    const theme = useTheme();
    // Replaced isFetching with isLoading to avoid flicker effect when refreshing data, eg when PATCHing a payment
    const { data, isLoading } = useGetPaymentLots(params);
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
                <SimpleTableWithDeepLink
                    marginTop={false}
                    data={data}
                    defaultSorted={[{ id: 'created_at', desc: true }]}
                    // @ts-ignore
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
