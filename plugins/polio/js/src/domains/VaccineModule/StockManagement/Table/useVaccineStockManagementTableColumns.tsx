import React, { useMemo } from 'react';
import { Column, IconButton, useSafeIntl } from 'bluesquare-components';
import { STOCK_MANAGEMENT_DETAILS } from '../../../../constants/routes';
import MESSAGES from '../messages';

export const useVaccineStockManagementTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    // const { mutateAsync: deleteVrf } = useDeleteVrf();
    return useMemo(() => {
        return [
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
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vialsUsed),
                accessor: 'vials_used',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.stockUsableVials),
                accessor: 'stock_of_usable_vials',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.leftoverPercentage),
                accessor: 'leftover_ratio',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.stockUnusableVials),
                accessor: 'stock_of_unusable_vials',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vialsDestroyed),
                accessor: 'vials_destroyed',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <IconButton
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                                // disabled
                                url={`${STOCK_MANAGEMENT_DETAILS}/id/${settings.row.original.id}`}
                            />
                        </>
                    );
                },
            },
        ];
    }, [formatMessage]);
};
