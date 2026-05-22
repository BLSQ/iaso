import React, { FunctionComponent, useState, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import {
    commonStyles,
    selectionInitialState,
    useSafeIntl,
    setTableSelection,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { Selection } from '../orgUnits/types/selection';
import { AddPaymentLotDialog } from './components/CreatePaymentLot/PaymentLotDialog';
import { PotentialPaymentsFilters } from './components/CreatePaymentLot/PotentialPaymentsFilters';
import { usePaymentColumns } from './hooks/config/usePaymentColumns';
import { useGetPotentialPayments } from './hooks/requests/useGetPotentialPayments';
import MESSAGES from './messages';
import { PotentialPaymentParams, PotentialPayment } from './types';

const baseUrl = baseUrls.potentialPayments;
export const PotentialPayments: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrl,
    ) as unknown as PotentialPaymentParams;

    const { data, isFetching } = useGetPotentialPayments(params);
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const columns = usePaymentColumns({ potential: true });
    const [selection, setSelection] = useState<Selection<PotentialPayment>>(
        selectionInitialState,
    );
    const multiEditDisabled =
        !selection.selectAll && selection.selectedItems.length === 0;
    const handleTableSelection = useCallback(
        (selectionType, items = [], totalCount = 0) => {
            const newSelection: Selection<PotentialPayment> = setTableSelection(
                selection,
                selectionType,
                items,
                totalCount,
            );
            setSelection(newSelection);
        },
        [selection],
    );
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                <PotentialPaymentsFilters
                    params={params}
                    setSelection={setSelection}
                />
                <Box display="flex" justifyContent="flex-end">
                    <AddPaymentLotDialog
                        iconProps={{
                            disabled:
                                multiEditDisabled || data?.results.length === 0,
                        }}
                        selection={selection}
                        titleMessage={formatMessage(MESSAGES.createLot)}
                        params={params}
                        setSelection={setSelection}
                    />
                </Box>
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'user__last_name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{ loading: isFetching }}
                    multiSelect
                    selection={selection}
                    selectionActions={[]}
                    //  @ts-ignore
                    setTableSelection={(selectionType, items, totalCount) =>
                        handleTableSelection(selectionType, items, totalCount)
                    }
                />
            </Box>
        </>
    );
};
