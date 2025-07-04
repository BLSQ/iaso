import React, { ReactElement, useMemo } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { Column, IconButton, useSafeIntl } from 'bluesquare-components';
import {
    DateCell,
    MultiDateCell,
} from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { NumberCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import { SubTable } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/SubTable';
import DeleteDialog from '../../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { userHasOneOfPermissions } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { ColumnCell } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import {
    POLIO_SUPPLY_CHAIN_WRITE,
    POLIO_SUPPLY_CHAIN_READ,
    POLIO_SUPPLY_CHAIN_READ_ONLY,
} from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import { useCurrentUser } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { baseUrls } from '../../../../constants/urls';
import { useDeleteVrf } from '../hooks/api/vrf';
import MESSAGES from '../messages';
import { SupplyChainList } from '../types';
import { CampaignNameWithWarning } from '../../StockManagement/StockVariation/Table/CampaignNameWithWarning';

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
                Cell: settings => {
                    const category = settings.row.original.campaign_category;
                    return (
                        <CampaignNameWithWarning
                            text={settings.row.original.obr_name}
                            category={category}
                            isVrf
                        />
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
                Header: formatMessage(MESSAGES.vrfCreatedAt),
                accessor: 'created_at',
                sortable: true,
                Cell: DateCell,
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
                Header: formatMessage(MESSAGES.dosesReceived),
                accessor: 'doses_received',
                Cell: ({
                    row: { original },
                }: ColumnCell<SupplyChainList>): ReactElement => {
                    return <NumberCell value={original.doses_received} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.poNumbers),
                accessor: 'po_numbers',
                Cell: ({
                    row: { original },
                }: ColumnCell<SupplyChainList>): ReactElement => {
                    const poNumbers = original?.po_numbers;
                    const poNumbersList = poNumbers ? poNumbers.split(',') : [];
                    return (
                        <SubTable
                            values={poNumbersList}
                            renderValue={poNumber => poNumber}
                        />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.estimatedDateOfArrival),
                accessor: 'eta',
                id: 'eta',
                Cell: MultiDateCell,
            },
            {
                Header: 'VAR',
                accessor: 'var',
                id: 'var',
                Cell: MultiDateCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: ({
                    row: { original },
                }: ColumnCell<SupplyChainList>): ReactElement => {
                    return (
                        <>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_SUPPLY_CHAIN_WRITE,
                                    POLIO_SUPPLY_CHAIN_READ,
                                    POLIO_SUPPLY_CHAIN_READ_ONLY,
                                ]}
                            >
                                <IconButton
                                    icon={
                                        userHasOneOfPermissions(
                                            [POLIO_SUPPLY_CHAIN_READ_ONLY],
                                            currentUser,
                                        )
                                            ? 'remove-red-eye'
                                            : 'edit'
                                    }
                                    overrideIcon={
                                        !userHasOneOfPermissions(
                                            [POLIO_SUPPLY_CHAIN_READ_ONLY],
                                            currentUser,
                                        )
                                            ? EditIcon
                                            : undefined
                                    }
                                    tooltipMessage={
                                        userHasOneOfPermissions(
                                            [POLIO_SUPPLY_CHAIN_READ_ONLY],
                                            currentUser,
                                        )
                                            ? MESSAGES.see
                                            : MESSAGES.edit
                                    }
                                    url={`/${baseUrls.vaccineSupplyChainDetails}/id/${original.id}`}
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_SUPPLY_CHAIN_WRITE,
                                    POLIO_SUPPLY_CHAIN_READ,
                                ]}
                            >
                                <DeleteDialog
                                    titleMessage={MESSAGES.deleteVRF}
                                    message={MESSAGES.deleteVRFWarning}
                                    onConfirm={() => deleteVrf(original.id)}
                                />
                            </DisplayIfUserHasPerm>
                        </>
                    );
                },
            },
        ];

        return columns;
    }, [currentUser, deleteVrf, formatMessage]);
};
