import React, { useMemo } from 'react';
import { Column, formatThousand, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DeleteAuthorisationModal } from './Modals/Delete/DeleteAuthorisationModal';

export const useNopv2AuthDetailsTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'country.name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.expirationDate),
                accessor: 'expiration_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.quantity),
                accessor: 'quantity',
                Cell: settings => (
                    <span>
                        {formatThousand(settings.row.original.quantity)}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'status',
                Cell: settings => (
                    <span
                        style={
                            settings.row.original.status === 'expired'
                                ? { color: 'red' }
                                : undefined
                        }
                    >
                        {formatMessage(
                            MESSAGES[settings.row.original.status],
                        ).toUpperCase()}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.comment),
                accessor: 'comment',
            },
            {
                Header: formatMessage(MESSAGES.comment),
                accessor: 'account',
                Cell: settings => {
                    return (
                        <>
                            <div>EDIT</div>
                            {/* @ts-ignore */}
                            <DeleteAuthorisationModal
                                authorisationId={settings.row.original.id}
                            />
                        </>
                    );
                },
            },
        ];
    }, [formatMessage]);
};
