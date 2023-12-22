import React, {
    FunctionComponent,
    useMemo,
    useState,
    useCallback,
} from 'react';
import { Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Settings';
import {
    useSafeIntl,
    // @ts-ignore
    selectionInitialState,
    // @ts-ignore
    setTableSelection,
    useSkipEffectOnMount,
} from 'bluesquare-components';

// COMPONENTS
import { UseMutateAsyncFunction } from 'react-query';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { OrgUnitsMultiActionsDialog } from './OrgUnitsMultiActionsDialog';
// COMPONENTS

// TYPES
import { OrgUnit, OrgUnitParams } from '../types/orgUnit';
import { Search } from '../types/search';
import { Selection } from '../types/selection';
import { Result as OrgUnitResult } from '../hooks/requests/useGetOrgUnits';
// TYPES

// UTILS
import { decodeSearch } from '../utils';
// UTILS

// CONSTANTS
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';
// CONSTANTS

// HOOKS
import { useGetOrgUnitsTableColumns } from '../hooks/useGetOrgUnitsTableColumns';
// HOOKS

type Props = {
    params: OrgUnitParams;
    resetPageToOne: string;
    orgUnitsData: OrgUnitResult;
    saveMulti: UseMutateAsyncFunction<unknown, unknown, unknown, unknown>;
};

const baseUrl = baseUrls.orgUnits;
export const TableList: FunctionComponent<Props> = ({
    params,
    resetPageToOne,
    orgUnitsData,
    saveMulti,
}) => {
    const { formatMessage } = useSafeIntl();

    const [multiActionPopupOpen, setMultiActionPopupOpen] =
        useState<boolean>(false);
    const [selection, setSelection] = useState<Selection<OrgUnit>>(
        selectionInitialState,
    );

    const searches: [Search] = useMemo(
        () => decodeSearch(decodeURI(params.searches)),
        [params.searches],
    );

    const columns = useGetOrgUnitsTableColumns(searches);

    const multiEditDisabled =
        !selection.selectAll && selection.selectedItems.length === 0;

    const handleTableSelection = useCallback(
        (selectionType, items = [], totalCount = 0) => {
            const newSelection: Selection<OrgUnit> = setTableSelection(
                selection,
                selectionType,
                items,
                totalCount,
            );
            setSelection(newSelection);
        },
        [selection],
    );
    const selectionActions = useMemo(
        () => [
            {
                icon: <EditIcon />,
                label: formatMessage(MESSAGES.multiSelectionAction),
                onClick: () => setMultiActionPopupOpen(true),
                disabled: multiEditDisabled,
            },
        ],
        [formatMessage, multiEditDisabled, setMultiActionPopupOpen],
    );

    useSkipEffectOnMount(() => {
        handleTableSelection('reset');
    }, [resetPageToOne]);
    return (
        <>
            <OrgUnitsMultiActionsDialog
                open={multiActionPopupOpen}
                params={params}
                closeDialog={() => setMultiActionPopupOpen(false)}
                selection={selection}
                saveMulti={saveMulti}
            />
            <Box mt={-4}>
                <TableWithDeepLink
                    resetPageToOne={resetPageToOne}
                    data={orgUnitsData?.orgunits || []}
                    count={orgUnitsData?.count}
                    pages={orgUnitsData?.pages}
                    params={params}
                    columns={columns}
                    baseUrl={baseUrl}
                    marginTop={false}
                    extraProps={{
                        columns,
                    }}
                    multiSelect
                    selection={selection}
                    selectionActions={selectionActions}
                    setTableSelection={(selectionType, items, totalCount) =>
                        handleTableSelection(selectionType, items, totalCount)
                    }
                />
            </Box>
        </>
    );
};
