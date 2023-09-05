import React, {
    FunctionComponent,
    useMemo,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { makeStyles, Box, Tabs, Tab } from '@material-ui/core';
import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { useQueryClient } from 'react-query';

// COMPONENTS
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import { OrgUnitFiltersContainer } from './components/OrgUnitFiltersContainer';
import TopBar from '../../components/nav/TopBarComponent';
import { OrgUnitsMap } from './components/OrgUnitsMap';
import { TableList } from './components/TableList';
// COMPONENTS

// TYPES
import { OrgUnitParams } from './types/orgUnit';
import { Search } from './types/search';
// TYPES

// UTILS
import { decodeSearch } from './utils';
import { convertObjectToString } from '../../utils/dataManipulation';
import { redirectTo, redirectToReplace } from '../../routing/actions';
import { getChipColors } from '../../constants/chipColors';
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
    const [tab, setTab] = useState<string>(params.tab ?? 'list');
    // STATE

    // MEMO
    const searches: [Search] = useMemo(() => {
        return decodeSearch(decodeURI(params.searches));
    }, [params.searches]);
    const isSearchActive: boolean = useMemo(
        () => params.searchActive === 'true',
        [params.searchActive],
    );
    // MEMO

    // CUSTOM HOOKS
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
        isSearchActive,
    });
    const {
        data: orgUnitsDataLocation,
        isFetching: isFetchingOrgUnitsDataLocation,
        refetch: fetchOrgUnitsLocations,
    } = useGetOrgUnitsLocations({
        params: apiParamsLocations,
        searches,
        isSearchActive,
    });
    // REQUESTS HOOKS

    const getSearchColor = useCallback(
        currentSearchIndex => {
            const currentSearch = searches[currentSearchIndex];
            let currentColor;
            if (currentSearch) {
                currentColor = currentSearch.color;
            }
            if (!currentColor) {
                currentColor = getChipColors(currentSearchIndex);
            } else {
                currentColor = `#${currentColor}`;
            }
            return currentColor;
        },
        [searches],
    );

    const handleSearch = useCallback(() => {
        if (isSearchActive) {
            fetchOrgUnits();
            fetchOrgUnitsLocations();
        }
    }, [fetchOrgUnits, fetchOrgUnitsLocations, isSearchActive]);

    const onSearch = useCallback(
        newParams => {
            // handleTableSelection('reset');
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
        [dispatch],
    );

    // TABS
    const handleChangeTab = useCallback(
        newtab => {
            setTab(newtab);
            const newParams = {
                ...params,
                tab: newtab,
            };
            dispatch(redirectToReplace(baseUrl, newParams));
        },
        [params, dispatch],
    );
    // TABS

    // onload, if searchActive is true and cache empty => set launch search
    useEffect(() => {
        if (isSearchActive) {
            const cachedOrgUnits = queryClient.getQueryData(['orgunits']);
            const cachedLocations = queryClient.getQueryData([
                'orgunitslocations',
            ]);
            if (!cachedOrgUnits || !cachedLocations) {
                handleSearch();
            }
        }
    }, [handleSearch, isSearchActive, queryClient]);

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
    }, [searches, refresh]);

    const isLoading =
        isFetchingOrgUnits ||
        isSavingMulti ||
        (tab === 'map' &&
            isFetchingOrgUnitsDataLocation &&
            isFetchingOrgunitTypes);
    return (
        <>
            {isLoading && <LoadingSpinner fixed={false} absolute />}
            <TopBar title={formatMessage(MESSAGES.title)} />

            <Box className={classes.container}>
                <OrgUnitFiltersContainer
                    params={params}
                    onSearch={onSearch}
                    currentTab={tab}
                    paramsSearches={searches || []}
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
                                <TableList
                                    params={params}
                                    saveMulti={saveMulti}
                                    resetPageToOne={resetPageToOne}
                                    orgUnitsData={orgUnitsData}
                                />
                            )}

                            <div
                                className={
                                    tab === 'map' ? '' : classes.hiddenOpacity
                                }
                            >
                                <div className={classes.containerMarginNeg}>
                                    <OrgUnitsMap
                                        getSearchColor={getSearchColor}
                                        orgUnitTypes={orgunitTypes || []}
                                        orgUnits={
                                            orgUnitsDataLocation || {
                                                locations: [],
                                                shapes: [],
                                            }
                                        }
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </Box>
            </Box>
        </>
    );
};
