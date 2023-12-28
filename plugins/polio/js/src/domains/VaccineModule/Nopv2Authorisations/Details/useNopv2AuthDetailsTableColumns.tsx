import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DeleteAuthorisationModal } from './Modals/Delete/DeleteAuthorisationModal';
import { EditAuthorisationModal } from './Modals/CreateEdit/CreateEditAuthorisationModal';
import { Nopv2AuthorisationsStatusCell } from '../Table/Nopv2AuthorisationsStatusCell';
import { useCurrentUser } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { userHasPermission } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';

export const useNopv2AuthDetailsTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    return useMemo(() => {
        const columns = [
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'country.name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vaccineAuthStartDate),
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
        ];
        if (
            userHasPermission(
                'iaso_polio_vaccine_authorizations_admin',
                currentUser,
            )
        ) {
            columns.push({
                Header: formatMessage(MESSAGES.actions),
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
            });
        }

        return columns;
    }, [currentUser, formatMessage]);
};
