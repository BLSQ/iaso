import React, { FunctionComponent, useState, useCallback } from 'react';
import {
    commonStyles,
    selectionInitialState,
    useSafeIntl,
    setTableSelection,
} from 'bluesquare-components';
import { Box, useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { PotentialPaymentParams, PotentialPayment } from './types';
import { useGetPotentialPayments } from './hooks/requests/useGetPotentialPayments';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { PotentialPaymentsFilters } from './components/PotentialPaymentsFilters';
import { redirectTo } from '../../routing/actions';
import { usePotentialPaymentColumns } from './config/usePotentialPaymentColumns';
import { Selection } from '../orgUnits/types/selection';
import { AddPaymentLotDialog } from './components/PaymentLotDialog';

type Props = {
    params: PotentialPaymentParams;
};
const baseUrl = baseUrls.potentialPayments;
export const PotentialPayments: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();

    const { data, isFetching } = useGetPotentialPayments(params);
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const columns = usePotentialPaymentColumns();
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
                <PotentialPaymentsFilters params={params} />
                <Box display="flex" justifyContent="flex-end">
                    <AddPaymentLotDialog
                        iconProps={{ disabled: multiEditDisabled }}
                        selection={selection}
                        titleMessage={formatMessage(MESSAGES.createLot)}
                        params={params}
                    />
                </Box>
                {/* @ts-ignore */}
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
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                />
            </Box>
        </>
    );
};
