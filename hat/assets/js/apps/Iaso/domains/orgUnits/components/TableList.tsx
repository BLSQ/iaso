import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import EditIcon from '@mui/icons-material/Settings';
import { Box } from '@mui/material';
import {
    selectionInitialState,
    setTableSelection,
    useSafeIntl,
} from 'bluesquare-components';

import { UseMutateAsyncFunction } from 'react-query';

import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';

import { useQueryUpdateListener } from '../../../hooks/useQueryUpdateListener';
import { ORG_UNITS } from '../../../utils/permissions';
import {
    useCheckUserHasWriteTypePermission,
    useCurrentUser,
} from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import { Result as OrgUnitResult } from '../hooks/requests/useGetOrgUnits';
import { useGetOrgUnitsTableColumns } from '../hooks/useGetOrgUnitsTableColumns';
import MESSAGES from '../messages';
import { OrgUnit, OrgUnitParams } from '../types/orgUnit';
import { Search } from '../types/search';
import { Selection } from '../types/selection';
import { decodeSearch } from '../utils';
import { OrgUnitsMultiActionsDialog } from './OrgUnitsMultiActionsDialog';

type Props = {
    params: OrgUnitParams;
    orgUnitsData?: OrgUnitResult;
    saveMulti: UseMutateAsyncFunction<unknown, unknown, unknown, unknown>;
};

const baseUrl = baseUrls.orgUnits;
export const TableList: FunctionComponent<Props> = ({
    params,
    orgUnitsData,
    saveMulti,
}) => {
    const { formatMessage } = useSafeIntl();

    const currentUser = useCurrentUser();
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
        !userHasPermission(ORG_UNITS, currentUser) ||
        (!selection.selectAll && selection.selectedItems.length === 0);

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
    const checkUserHasWriteTypePermission =
        useCheckUserHasWriteTypePermission();

    const getIsSelectionDisabled = useCallback(
        (ou: OrgUnit) => !checkUserHasWriteTypePermission(ou.org_unit_type_id),
        [checkUserHasWriteTypePermission],
    );

    useQueryUpdateListener({
        queryKey: 'orgunits',
        onUpdate: () => {
            handleTableSelection('reset');
        },
    });

    return (
        <>
            <OrgUnitsMultiActionsDialog
                open={multiActionPopupOpen}
                params={params}
                closeDialog={() => setMultiActionPopupOpen(false)}
                selection={selection}
                saveMulti={saveMulti}
            />
            <Box mt={-4} pb={2}>
                <TableWithDeepLink
                    data={orgUnitsData?.orgunits || []}
                    count={orgUnitsData?.count}
                    pages={orgUnitsData?.pages}
                    params={params}
                    columns={columns}
                    baseUrl={baseUrl}
                    marginTop={false}
                    extraProps={{
                        columns,
                        data: orgUnitsData?.orgunits || [],
                        count: orgUnitsData?.count,
                    }}
                    multiSelect
                    selection={selection}
                    selectionActions={selectionActions}
                    setTableSelection={(selectionType, items, totalCount) =>
                        handleTableSelection(selectionType, items, totalCount)
                    }
                    getIsSelectionDisabled={getIsSelectionDisabled}
                />
            </Box>
        </>
    );
};
