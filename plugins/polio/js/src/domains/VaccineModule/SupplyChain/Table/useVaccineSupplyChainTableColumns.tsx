import React, { useMemo } from 'react';
import {
    Column,
    IconButton,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { NumberCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import { useCurrentUser } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import {
    DateCell,
    MultiDateCell,
} from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../messages';
import DeleteDialog from '../../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import { VACCINE_SUPPLY_CHAIN_DETAILS } from '../../../../constants/routes';
import { useDeleteVrf } from '../hooks/api/vrf';
import { userHasPermission } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { POLIO_SUPPLY_CHAIN_WRITE } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';

export const useVaccineSupplyChainTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteVrf } = useDeleteVrf();
    const currentUser = useCurrentUser();
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'country.name',
                id: 'country',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vaccine),
                accessor: 'vaccine_type',
                id: 'vaccine_type',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.obrName),
                accessor: 'obr_name',
                sortable: true,
            },

            {
                Header: formatMessage(MESSAGES.poNumbers),
                accessor: 'po_numbers',
                Cell: settings => {
                    const poNumbers = settings.row.original?.po_numbers ?? '';
                    const poNumbersList = poNumbers.split(',');
                    return (
                        <>
                            {poNumbersList.map(poNumber => (
                                <div key={poNumber}>
                                    {poNumber ?? textPlaceholder}
                                </div>
                            ))}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.roundNumbers),
                id: 'rounds',
                Cell: settings => {
                    const { rounds } = settings.row.original;
                    return <span>{rounds.map(r => r.number).join(', ')}</span>;
                },
            },
            {
                Header: formatMessage(MESSAGES.startDate),
                accessor: 'start_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.endDate),
                accessor: 'end_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.dosesShipped),
                accessor: 'doses_shipped',
                Cell: settings => (
                    <NumberCell value={settings.row.original.doses_shipped} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.estimatedDateOfArrival),
                accessor: 'eta',
                Cell: MultiDateCell,
            },
            {
                Header: 'VAR',
                accessor: 'var',
                Cell: MultiDateCell,
            },
        ];
        if (userHasPermission(POLIO_SUPPLY_CHAIN_WRITE, currentUser)) {
            columns.push({
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <IconButton
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                                url={`${VACCINE_SUPPLY_CHAIN_DETAILS}/id/${settings.row.original.id}`}
                            />
                            <DeleteDialog
                                titleMessage={MESSAGES.deleteVRF}
                                message={MESSAGES.deleteVRFWarning}
                                onConfirm={() =>
                                    deleteVrf(settings.row.original.id)
                                }
                            />
                        </>
                    );
                },
            });
        }
        return columns;
    }, [currentUser, deleteVrf, formatMessage]);
};
