import React, {
    FunctionComponent,
    useMemo,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { makeStyles, Box, Tabs, Tab } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    selectionInitialState,
    // @ts-ignore
    setTableSelection,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { useQueryClient } from 'react-query';

// COMPONENTS
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import { OrgUnitsMultiActionsDialog } from './components/OrgUnitsMultiActionsDialog';
import { OrgUnitFiltersContainer } from './components/OrgUnitFiltersContainer';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { OrgUnitsMap } from './components/OrgUnitsMap';
// COMPONENTS

// TYPES
import { OrgUnit, OrgUnitParams } from './types/orgUnit';
import { Search } from './types/search';
import { Selection } from './types/selection';
// TYPES

// UTILS
import { decodeSearch } from './utils';
import { convertObjectToString } from '../../utils';
import { redirectTo } from '../../routing/actions';
// UTILS

// CONSTANTS
import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import { MENU_HEIGHT_WITHOUT_TABS } from '../../constants/uiConstants';
// CONSTANTS

// HOOKS
import {
    useGetOrgUnits,
    useGetOrgUnitsLocations,
} from './hooks/requests/useGetOrgUnits';
import { useGetOrgUnitsTableColumns } from './hooks/useGetOrgUnitsTableColumns';
import { useBulkSaveOrgUnits } from './hooks/requests/useBulkSaveOrgUnits';
import { useGetApiParams } from './hooks/useGetApiParams';
import { useGetOrgUnitTypes } from './hooks/requests/useGetOrgUnitTypes';
// HOOKS

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    container: {
        width: '100%',
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
        padding: 0,
        margin: 0,
        overflow: 'auto',
        backgroundColor: 'white',
        position: 'relative',
        top: 48,
        '& .MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
            position: 'fixed',
        },
    },
    tabs: {
        ...commonStyles(theme).tabs,
        padding: 0,
    },
    hiddenOpacity: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        zIndex: '-100',
        opacity: '0',
        width: '100%',
    },
}));

type Props = {
    params: OrgUnitParams;
};

const baseUrl = baseUrls.orgUnits;
export const OrgUnits: FunctionComponent<Props> = ({ params }) => {
    // HOOKS
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    // HOOKS

    // STATE
    const [resetPageToOne, setResetPageToOne] = useState<string>('');
    const [deletedTab, setDeletedTab] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [filtersUpdated, setFiltersUpdated] = useState<boolean>(true);
    const [multiActionPopupOpen, setMultiActionPopupOpen] =
        useState<boolean>(false);
    const [tab, setTab] = useState<string>(params.tab ?? 'list');
    const [selection, setSelection] = useState<Selection<OrgUnit>>(
        selectionInitialState,
    );
    // STATE

    // MEMO
    const searches: [Search] = useMemo(
        () => decodeSearch(decodeURI(params.searches)),
        [params.searches],
    );
    const isSearchActive: boolean = useMemo(
        () => params.searchActive === 'true',
        [params.searchActive],
    );
    // MEMO

    // CUSTOM HOOKS
    const columns = useGetOrgUnitsTableColumns(searches);
    const { getUrl, apiParams } = useGetApiParams(searches, params);
    const { apiParams: apiParamsLocations } = useGetApiParams(
        searches,
        params,
        true,
    );
    // CUSTOM HOOKS

    // REQUESTS HOOKS

    const { data: orgunitTypes, isFetching: isFetchingOrgunitTypes } =
        useGetOrgUnitTypes();
    const { mutateAsync: saveMulti, isLoading: isSavingMulti } =
        useBulkSaveOrgUnits();
    const {
        data: orgUnitsData,
        isFetching: isFetchingOrgUnits,
        refetch: fetchOrgUnits,
    } = useGetOrgUnits({
        params: apiParams,
        callback: () => {
            setFiltersUpdated(false);
        },
    });
    const {
        data: orgUnitsDataLocation,
        isFetching: isFetchingOrgUnitsDataLocation,
        refetch: fetchOrgUnitsLocations,
    } = useGetOrgUnitsLocations({
        params: apiParamsLocations,
        searches,
    });
    // REQUESTS HOOKS

    // SELECTION
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
        [multiEditDisabled, formatMessage],
    );
    // SELECTION

    const handleSearch = useCallback(() => {
        fetchOrgUnits();
        fetchOrgUnitsLocations();
    }, [fetchOrgUnits, fetchOrgUnitsLocations]);

    const onSearch = useCallback(
        newParams => {
            handleTableSelection('reset');
            const tempParams = {
                ...newParams,
                searches: JSON.stringify(newParams.searches),
            };
            if (newParams.searchActive !== 'true') {
                tempParams.searchActive = true;
            }
            setResetPageToOne(convertObjectToString(tempParams));
            dispatch(redirectTo(baseUrl, tempParams));
            setRefresh(true);
        },
        [handleTableSelection, dispatch],
    );

    // TABS
    const handleChangeTab = useCallback(
        newtab => {
            setTab(newtab);
            const newParams = {
                ...params,
                tab: newtab,
            };
            dispatch(redirectTo(baseUrl, newParams));
        },
        [params, dispatch],
    );
    // TABS

    // onload, if searchActive is true => set launch search
    useEffect(() => {
        if (isSearchActive) {
            handleSearch();
        }
        return () => {
            queryClient
                .getQueryCache()
                .findAll(['orgunits'])
                .forEach(query => query.setData(undefined));
            queryClient
                .getQueryCache()
                .findAll(['orgunitslocations'])
                .forEach(query => query.setData(undefined));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // trigger search on order, page size and page
    useSkipEffectOnMount(() => {
        handleSearch();
    }, [params.order, params.page, params.pageSize]);

    // trigger search after delete tab redirection
    useSkipEffectOnMount(() => {
        if (isSearchActive && deletedTab) {
            setDeletedTab(false);
            handleSearch();
        }
    }, [apiParams.searches]);

    useSkipEffectOnMount(() => {
        if (refresh) {
            setRefresh(false);
            handleSearch();
        }
    }, [searches]);

    const isLoading =
        isFetchingOrgUnits ||
        isSavingMulti ||
        (tab === 'map' &&
            isFetchingOrgUnitsDataLocation &&
            isFetchingOrgunitTypes);
    return (
        <>
            <OrgUnitsMultiActionsDialog
                open={multiActionPopupOpen}
                params={params}
                closeDialog={() => setMultiActionPopupOpen(false)}
                selection={selection}
                saveMulti={saveMulti}
            />
            {isLoading && <LoadingSpinner fixed={false} absolute />}
            <TopBar title={formatMessage(MESSAGES.title)} />

            <Box className={classes.container}>
                <OrgUnitFiltersContainer
                    params={params}
                    onSearch={onSearch}
                    currentTab={tab}
                    filtersUpdated={filtersUpdated}
                    defaultSearches={searches}
                    setFiltersUpdated={setFiltersUpdated}
                    orgunitTypes={orgunitTypes || []}
                    isFetchingOrgunitTypes={isFetchingOrgunitTypes}
                    counts={(!isLoading && orgUnitsData?.counts) || []}
                    setDeletedTab={setDeletedTab}
                />
                {tab === 'list' &&
                    orgUnitsData &&
                    orgUnitsData?.orgunits?.length > 0 && (
                        <Box
                            mb={2}
                            mt={2}
                            mr={4}
                            display="flex"
                            justifyContent="flex-end"
                        >
                            <DownloadButtonsComponent
                                csvUrl={getUrl(true, 'csv')}
                                xlsxUrl={getUrl(true, 'xlsx')}
                                gpkgUrl={getUrl(true, 'gpkg')}
                            />
                        </Box>
                    )}
                <Box px={4}>
                    {orgUnitsData && (
                        <>
                            <Tabs
                                value={tab}
                                classes={{
                                    root: classes.tabs,
                                }}
                                className={classes.marginBottom}
                                indicatorColor="primary"
                                onChange={(event, newtab) =>
                                    handleChangeTab(newtab)
                                }
                            >
                                <Tab
                                    value="list"
                                    label={formatMessage(MESSAGES.list)}
                                />
                                <Tab
                                    value="map"
                                    label={formatMessage(MESSAGES.map)}
                                />
                            </Tabs>
                            {tab === 'list' && (
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
                                        setTableSelection={(
                                            selectionType,
                                            items,
                                            totalCount,
                                        ) =>
                                            handleTableSelection(
                                                selectionType,
                                                items,
                                                totalCount,
                                            )
                                        }
                                    />
                                </Box>
                            )}

                            {!isFetchingOrgunitTypes && orgUnitsDataLocation && (
                                <div
                                    className={
                                        tab === 'map'
                                            ? ''
                                            : classes.hiddenOpacity
                                    }
                                >
                                    <div className={classes.containerMarginNeg}>
                                        <OrgUnitsMap
                                            params={params}
                                            orgUnitTypes={orgunitTypes || []}
                                            orgUnits={orgUnitsDataLocation}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </>
    );
};
