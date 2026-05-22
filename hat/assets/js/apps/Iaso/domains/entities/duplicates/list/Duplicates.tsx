import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { PersonRemove } from '@mui/icons-material';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    ConfirmCancelModal,
    selectionInitialState,
    setTableSelection,
    useSafeIntl,
} from 'bluesquare-components';
import { starsStyleForTable } from 'Iaso/components/stars/StarsComponent';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useBulkIgnoreDuplicate } from 'Iaso/domains/entities/duplicates/hooks/api/useBulkIgnoreDuplicate';
import { Selection } from 'Iaso/domains/orgUnits/types/selection';
import { Profile } from 'Iaso/domains/teams/types/profile';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { PaginationParams } from 'Iaso/types/general';
import TopBar from '../../../../components/nav/TopBarComponent';
import { useGetLatestAnalysis } from '../hooks/api/analyzes';
import {
    DuplicatesGETParams,
    useGetDuplicates,
} from '../hooks/api/useGetDuplicates';
import MESSAGES from '../messages';
import { DuplicatesList } from '../types';
import { AnalyseAction } from './AnalyseAction';
import { DuplicatesFilters } from './DuplicatesFilters';
import { useDuplicationTableColumns } from './useDuplicationTableColumns';

type Params = PaginationParams & DuplicatesGETParams;

const baseUrl = baseUrls.entityDuplicates;

const defaultSorted = [{ id: 'similarity_star', desc: true }];

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        ...starsStyleForTable,
    };
});

const useMultiSelection = (
    setMultiActionPopupOpen: (open: boolean) => void,
) => {
    const { formatMessage } = useSafeIntl();
    const [selection, setSelection] = useState<Selection<Profile>>(
        selectionInitialState,
    );

    const multiEditDisabled =
        !selection.selectAll && selection.selectedItems.length === 0;
    const handleTableSelection = useCallback(
        (selectionType, items = [], totalCount = 0) => {
            const newSelection: Selection<Profile> = setTableSelection(
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
                icon: <PersonRemove />,
                label: formatMessage(MESSAGES.ignore),
                onClick: () => setMultiActionPopupOpen(true),
                disabled: multiEditDisabled,
            },
        ],
        [formatMessage, multiEditDisabled, setMultiActionPopupOpen],
    );
    return {
        selection,
        setSelection,
        handleTableSelection,
        selectionActions,
    };
};

export const Duplicates: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as Params;
    const [multiActionPopupOpen, setMultiActionPopupOpen] =
        useState<boolean>(false);
    const { selection, setSelection, handleTableSelection, selectionActions } =
        useMultiSelection(setMultiActionPopupOpen);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data: latestAnalysis, isFetching: isFetchingLatestAnalysis } =
        useGetLatestAnalysis();
    const { data, isFetching } = useGetDuplicates({
        params,
        refresh: latestAnalysis?.finished_at,
    });
    const columns = useDuplicationTableColumns();
    const { results, pages, count } = (data as DuplicatesList) ?? {
        results: [],
        pages: 1,
        count: 0,
    };
    const { mutate: bulkIgnore } = useBulkIgnoreDuplicate(params, () =>
        setSelection(selectionInitialState),
    );

    return (
        <>
            <ConfirmCancelModal
                id={'confirm-ignore-selection-dialog'}
                dataTestId={''}
                open={multiActionPopupOpen}
                onConfirm={() => bulkIgnore(selection)}
                confirmMessage={MESSAGES.confirm}
                cancelMessage={MESSAGES.cancel}
                onClose={() => {}}
                onCancel={() => {}}
                closeDialog={() => setMultiActionPopupOpen(false)}
                titleMessage={formatMessage(MESSAGES.ignoreSelectionTitle)}
            >
                {formatMessage(MESSAGES.ignoreSelectionMessage)}
            </ConfirmCancelModal>
            <TopBar
                title={formatMessage(MESSAGES.duplicates)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <AnalyseAction
                    latestAnalysis={latestAnalysis}
                    isFetchingLatestAnalysis={isFetchingLatestAnalysis}
                />
                <DuplicatesFilters params={params} />
                <Box className={classes.table}>
                    <TableWithDeepLink
                        marginTop={false}
                        data={results}
                        pages={pages}
                        multiSelect
                        selectionActions={selectionActions}
                        selection={selection}
                        setTableSelection={handleTableSelection}
                        defaultSorted={defaultSorted}
                        columns={columns}
                        count={count ?? 0}
                        baseUrl={baseUrl}
                        params={params}
                        getObjectId={it => it.id}
                        expanded={{}}
                        extraProps={{
                            loading: isFetching,
                        }}
                    />
                </Box>
            </Box>
        </>
    );
};
