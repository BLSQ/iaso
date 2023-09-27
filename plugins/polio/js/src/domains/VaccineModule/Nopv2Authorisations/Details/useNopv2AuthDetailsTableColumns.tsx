import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DeleteAuthorisationModal } from './Modals/Delete/DeleteAuthorisationModal';
import { EditAuthorisationModal } from './Modals/CreateEdit/CreateEditAuthorisationModal';
import { Nopv2AuthorisationsStatusCell } from '../Table/Nopv2AuthorisationsStatusCell';

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
                Header: formatMessage(MESSAGES.vaccineAuthStartingDate),
                accessor: 'start_date',
                id: 'start_date',
                sortable: true,
                Cell: DateCell,
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
                        {settings.row.original.quantity > 0
                            ? settings.row.original.quantity
                            : '--'}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'status',
                Cell: settings => {
                    const { status } = settings.row.original;
                    return <Nopv2AuthorisationsStatusCell status={status} />;
                },
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
                            {/* @ts-ignore */}
                            <EditAuthorisationModal
                                authorisationData={settings.row.original}
                                countryId={settings.row.original.country.id}
                                countryName={settings.row.original.country.name}
                            />
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
