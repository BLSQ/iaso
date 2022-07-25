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
    DynamicTabs,
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
import { useCurrentUser } from '../../utils/usersUtils';
import { redirectTo } from '../../routing/actions';
// UTILS

// CONSTANTS
import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import { getChipColors } from '../../constants/chipColors';
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
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    // HOOKS

    // STATE
    const [resetPageToOne, setResetPageToOne] = useState<string>('');
    const [triggerSearch, setTriggerSearch] = useState<boolean>(false);
    const [filtersUpdated, setFiltersUpdated] = useState<boolean>(true);
    const [multiActionPopupOpen, setMultiActionPopupOpen] =
        useState<boolean>(false);
    const [tab, setTab] = useState<string>(params.tab ?? 'list');
    const [selection, setSelection] = useState<Selection<OrgUnit>>(
        selectionInitialState,
    );

    const [searches, setSearches] = useState<[Search]>(
        decodeSearch(decodeURI(params.searches)),
    );
    // STATE

    // MEMO
    const defaultSource = useMemo(
        () => currentUser?.account?.default_version?.data_source,
        [currentUser],
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
    const { data: orgUnitsData, isFetching: isFetchingOrgUnits } =
        useGetOrgUnits({
            params: apiParams,
            enabled: triggerSearch,
            callback: () => {
                setFiltersUpdated(false);
                setTriggerSearch(false);
            },
        });
    const {
        data: orgUnitsDataLocation,
        isFetching: isFetchingOrgUnitsDataLocation,
    } = useGetOrgUnitsLocations({
        params: apiParamsLocations,
        enabled: triggerSearch,
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

    const onSearch = useCallback(
        newParams => {
            handleTableSelection('reset');
            const tempParams = { ...newParams };
            if (newParams.searchActive !== 'true') {
                tempParams.searchActive = true;
            }
            setResetPageToOne(convertObjectToString(tempParams));
            setTriggerSearch(true);
            dispatch(redirectTo(baseUrl, tempParams));
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

    // refetch results too map searches and org units search indexes
    const handleDeletedDynamicTab = useCallback(
        newParams => {
            setSearches(decodeSearch(decodeURI(newParams.searches)));
            dispatch(redirectTo(baseUrl, newParams));
            setTriggerSearch(true);
        },
        [dispatch],
    );

    const handleAddDynamicTab = useCallback(
        newParams => {
            setFiltersUpdated(true);
            setTriggerSearch(false);
            setSearches(decodeSearch(decodeURI(newParams.searches)));
            dispatch(redirectTo(baseUrl, newParams));
        },
        [dispatch],
    );
    // TABS

    // onload, if searchActive is true => set triggerSearch to true
    useEffect(() => {
        if (params.searchActive === 'true') {
            setTriggerSearch(true);
        }
        return () => {
            setSearches([
                {
                    validation_status: 'all',
                    color: getChipColors(0).replace('#', ''),
                },
            ]);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // trigger search on order, page size and page
    useSkipEffectOnMount(() => {
        setTriggerSearch(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.order, params.page, params.pageSize]);

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
            <TopBar title={formatMessage(MESSAGES.title)}>
                <DynamicTabs
                    deleteMessage={MESSAGES.delete}
                    addMessage={MESSAGES.add}
                    baseLabel={formatMessage(MESSAGES.search)}
                    params={{ ...params, searches: JSON.stringify(searches) }}
                    defaultItem={{
                        validation_status: 'all',
                        color: getChipColors(
                            searches.length + 1,
                            false,
                            searches.map(search => `#${search.color}`),
                        ).replace('#', ''),
                        source: defaultSource && defaultSource.id,
                    }}
                    paramKey="searches"
                    tabParamKey="searchTabIndex"
                    baseUrl={baseUrl}
                    redirectTo={(path, newParams) =>
                        dispatch(redirectTo(path, newParams))
                    }
                    onTabChange={newParams => {
                        dispatch(redirectTo(baseUrl, newParams));
                    }}
                    onTabsDeleted={handleDeletedDynamicTab}
                    onTabsAdded={handleAddDynamicTab}
                    maxItems={9}
                    counts={
                        (params.searchActive === 'true' &&
                            orgUnitsData?.counts) ||
                        []
                    }
                    displayCounts
                />
            </TopBar>
            <Box className={classes.containerFullHeightNoTabPadded}>
                <OrgUnitFiltersContainer
                    params={params}
                    onSearch={onSearch}
                    currentTab={tab}
                    filtersUpdated={filtersUpdated}
                    searches={searches}
                    setSearches={setSearches}
                    setFiltersUpdated={setFiltersUpdated}
                    orgunitTypes={orgunitTypes || []}
                    isFetchingOrgunitTypes={isFetchingOrgunitTypes}
                />
                {orgUnitsData && params.searchActive === 'true' && (
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
                        {tab === 'list' &&
                            orgUnitsData &&
                            orgUnitsData?.orgunits?.length > 0 && (
                                <Box
                                    mb={4}
                                    mt={1}
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

                        {!isFetchingOrgunitTypes && orgUnitsDataLocation && (
                            <div
                                className={
                                    tab === 'map' ? '' : classes.hiddenOpacity
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
        </>
    );
};
