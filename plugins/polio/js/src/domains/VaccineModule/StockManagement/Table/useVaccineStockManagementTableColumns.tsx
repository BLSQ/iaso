import React, { useMemo } from 'react';
import {
    Column,
    IconButton,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../messages';
import { NumberCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';

export const useVaccineStockManagementTableColumns = (
    vaccineType?: string,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const columns = [
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'country_name',
                id: 'country_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vaccine),
                accessor: 'vaccine_type',
                id: 'vaccine_type',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vialsReceived),
                accessor: 'vials_received',
                sortable: false,
                Cell: settings => (
                    <NumberCell value={settings.row.original.vials_received} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.vialsUsed),
                accessor: 'vials_used',
                sortable: false,
                Cell: settings => (
                    <NumberCell value={settings.row.original.vials_used} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.stockUsableVials),
                accessor: 'stock_of_usable_vials',
                sortable: false,
                Cell: settings => (
                    <NumberCell
                        value={settings.row.original.stock_of_usable_vials}
                    />
                ),
            },
        ];

        if (vaccineType !== 'bOPV') {
            columns.push({
                Header: formatMessage(MESSAGES.stockUnusableVials),
                accessor: 'stock_of_unusable_vials',
                sortable: false,
                Cell: settings => {
                    // If no filter is selected, we can still see bOPV vaccines
                    const isBopv =
                        settings.row.original.vaccine_type === 'bOPV';
                    if (isBopv) {
                        return <span>{textPlaceholder}</span>;
                    }
                    return (
                        <NumberCell
                            value={
                                settings.row.original.stock_of_unusable_vials
                            }
                        />
                    );
                },
            });
        }
        columns.push(
            {
                Header: formatMessage(MESSAGES.vialsDestroyed),
                accessor: 'vials_destroyed',
                sortable: false,
                Cell: settings => (
                    <NumberCell value={settings.row.original.vials_destroyed} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: settings => {
                    return (
                        <IconButton
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.view}
                            url={`/${baseUrls.stockManagementDetails}/id/${settings.row.original.id}`}
                        />
                    );
                },
            },
        );

        return columns;
    }, [formatMessage, vaccineType]);
};
