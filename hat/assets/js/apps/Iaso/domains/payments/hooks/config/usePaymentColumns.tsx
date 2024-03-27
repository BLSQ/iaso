import React, { useMemo } from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import { UseMutateAsyncFunction } from 'react-query';
import MESSAGES from '../../messages';
import { PaymentLot, PotentialPayment } from '../../types';
import { textPlaceholder } from '../../../../constants/uiConstants';
import { EditPaymentDialog } from '../../components/EditPaymentLot/EditPaymentDialog';
import { SavePaymentStatusArgs } from '../requests/useSavePaymentStatus';

export const usePaymentColumns = ({
    potential = true,
    saveStatus,
}: {
    potential?: boolean;
    saveStatus?: UseMutateAsyncFunction<any, any, SavePaymentStatusArgs, any>;
    paymentLot?: PaymentLot;
}): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.lastName),
                id: 'user__last_name',
                accessor: 'user.last_name',
                Cell: ({
                    value,
                }: {
                    value: PotentialPayment['user']['last_name'];
                }): string => {
                    return value || textPlaceholder;
                },
            },
            {
                Header: formatMessage(MESSAGES.firstName),
                id: 'user__first_name',
                accessor: 'user.first_name',
                Cell: ({
                    value,
                }: {
                    value: PotentialPayment['user']['first_name'];
                }): string => {
                    return value || textPlaceholder;
                },
            },
            {
                Header: formatMessage(MESSAGES.userName),
                id: 'user__username',
                accessor: 'user.username',
                Cell: ({
                    value,
                }: {
                    value: PotentialPayment['user']['username'];
                }): string => {
                    return value || textPlaceholder;
                },
            },
            {
                Header: formatMessage(MESSAGES.changes),
                id: 'change_requests_count',
                accessor: 'change_requests',
                Cell: ({
                    value,
                }: {
                    value: PotentialPayment['change_requests'];
                }): string => {
                    return `${value.length}`;
                },
            },
            //  TODO: we should add user phone number here
        ];
        if (!potential) {
            return columns.concat([
                {
                    Header: formatMessage(MESSAGES.status),
                    id: 'status',
                    accessor: 'status',
                    Cell: settings =>
                        formatMessage(MESSAGES[settings.row.original.status]),
                },
                {
                    Header: formatMessage(MESSAGES.actions),
                    id: 'action',
                    accessor: 'action',
                    Cell: settings => {
                        const payment = settings.row.original;
                        return (
                            <EditPaymentDialog
                                status={payment.status}
                                id={payment.id}
                                iconProps={{}}
                                user={payment.user}
                                // if potential is false, then we know we're passing saveStatus
                                saveStatus={
                                    saveStatus as UseMutateAsyncFunction<
                                        any,
                                        any,
                                        SavePaymentStatusArgs,
                                        any
                                    >
                                }
                            />
                        );
                    },
                },
            ]);
        }
        return columns;
    }, [formatMessage, potential, saveStatus]);
};
