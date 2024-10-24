import React, { ReactElement, useMemo } from 'react';
import {
    Column,
    IconButton,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import EditIcon from '@mui/icons-material/Edit';
import { baseUrls } from '../../../../constants/urls';
import { NumberCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import { useCurrentUser } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import {
    DateCell,
    MultiDateCell,
    styleEven,
    styleOdds,
} from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../messages';
import DeleteDialog from '../../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import { useDeleteVrf } from '../hooks/api/vrf';
import { userHasPermission } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { POLIO_SUPPLY_CHAIN_WRITE } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import { SupplyChainList } from '../types';
import { ColumnCell } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { Box } from '@mui/material';




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
                Header: formatMessage(MESSAGES.dosesRequested),
                accessor: 'quantities_ordered_in_doses',
                Cell: ({
                    row: { original },
                }: ColumnCell<SupplyChainList>): ReactElement => {
                    return (
                        <NumberCell
                            value={original.quantities_ordered_in_doses}
                        />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.dosesShipped),
                accessor: 'doses_shipped',
                Cell: ({
                    row: { original },
                }: ColumnCell<SupplyChainList>): ReactElement => {
                    return <NumberCell value={original.doses_shipped} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.poNumbers),
                accessor: 'po_numbers',
                Cell: ({
                    row: { original },
                }: ColumnCell<SupplyChainList>): ReactElement => {
                    const poNumbers = original?.po_numbers ?? '';
                    const poNumbersList = poNumbers.split(',');
                    return (
                        <>
                            {poNumbersList.map((poNumber,i) => {
                                return (
                                <Box key={poNumber} sx={i%2 > 0 ? styleEven : styleOdds}>
                                    {poNumber ?? textPlaceholder}
                                </Box>
                            )})}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.estimatedDateOfArrival),
                accessor: 'eta',
                Cell: (settings)=> MultiDateCell({value:settings.row.original.eta,colorLines:true}),
            },
            {
                Header: 'VAR',
                accessor: 'var',
                Cell: (settings)=> MultiDateCell({value:settings.row.original.var,colorLines:true}),
            },
        ];
        if (userHasPermission(POLIO_SUPPLY_CHAIN_WRITE, currentUser)) {
            columns.push({
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: ({
                    row: { original },
                }: ColumnCell<SupplyChainList>): ReactElement => {
                    return (
                        <>
                            <IconButton
                                icon="edit"
                                overrideIcon={EditIcon}
                                tooltipMessage={MESSAGES.edit}
                                url={`/${baseUrls.vaccineSupplyChainDetails}/id/${original.id}`}
                            />
                            <DeleteDialog
                                titleMessage={MESSAGES.deleteVRF}
                                message={MESSAGES.deleteVRFWarning}
                                onConfirm={() => deleteVrf(original.id)}
                            />
                        </>
                    );
                },
            });
        }
        return columns;
    }, [currentUser, deleteVrf, formatMessage]);
};
