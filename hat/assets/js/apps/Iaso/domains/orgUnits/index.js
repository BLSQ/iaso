import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles, Box, Tabs, Tab, Grid } from '@material-ui/core';
import PropTypes from 'prop-types';

import EditIcon from '@material-ui/icons/Edit';

import {
    DynamicTabs,
    getTableUrl,
    selectionInitialState,
    setTableSelection,
    commonStyles,
    Table,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';

import { fetchSources, fetchOrgUnitsList } from '../../utils/requests';

import {
    setOrgUnits,
    setOrgUnitsLocations,
    setOrgUnitsListFetching,
    setSources,
    setFiltersUpdated,
    resetOrgUnits,
} from './actions';
import { redirectTo } from '../../routing/actions';

import { orgUnitsTableColumns } from './config';

import {
    decodeSearch,
    mapOrgUnitByLocation,
    encodeUriParams,
    encodeUriSearches,
} from './utils';
import { getFromDateString, getToDateString } from '../../utils/dates.ts';

import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import OrgUnitsFiltersComponent from './components/OrgUnitsFiltersComponent';
import OrgunitsMap from './components/OrgunitsMapComponent';
import OrgUnitsMultiActionsDialog from './components/OrgUnitsMultiActionsDialog';

import { getChipColors } from '../../constants/chipColors';

import { warningSnackBar } from '../../constants/snackBars';
import {
    enqueueSnackbar,
    closeFixedSnackbar,
} from '../../redux/snackBarsReducer';
import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import { locationLimitMax } from './constants/orgUnitConstants';
import { convertObjectToString } from '../../utils';

const baseUrl = baseUrls.orgUnits;

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
    },
    roundColor: {
        display: 'inline-block',
        width: 15,
        height: 15,
        borderRadius: 15,
    },
    statusNew: {
        color: theme.palette.primary.main,
    },
    statusValidated: {
        color: theme.palette.success.main,
    },
    statusRejected: {
        color: theme.palette.error.main,
    },
}));

const getDefaultSource = currentUser =>
    currentUser &&
    currentUser.account &&
    currentUser.account.default_version &&
    currentUser.account.default_version.data_source;

const OrgUnits = props => {
    const { params } = props;
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const dispatch = useDispatch();

    const reduxPage = useSelector(state => state.orgUnits.orgUnitsPage);
    const searchCounts = useSelector(
        state => state.orgUnits.orgUnitsPage.counts,
    );
    const fetchingList = useSelector(state => state.orgUnits.fetchingList);
    const fetchingOrgUnitTypes = useSelector(
        state => state.orgUnits.fetchingOrgUnitTypes,
    );
    const filtersUpdated = useSelector(state => state.orgUnits.filtersUpdated);
    const currentUser = useSelector(state => state.users.current);

    const [tab, setTab] = useState(params.tab ? params.tab : 'list');
    const [listUpdated, setListUpdated] = useState(false);
    const [warningDisplayed, setWarningDisplayed] = useState(false);
    const [multiActionPopupOpen, setMultiActionPopupOpen] = useState(false);
    const [selection, setSelection] = useState(selectionInitialState);
    const [shouldRenderFilters, setShouldRenderFilters] = useState(false);
    const [resetTablePage, setResetTablePage] = useState(
        convertObjectToString(params),
    );

    const tableColumns = orgUnitsTableColumns(
        formatMessage,
        classes,
        decodeSearch(params.searches),
    );

    const searches = useMemo(
        () => decodeSearch(params.searches),
        [params.searches],
    );
    const orgunits =
        reduxPage.list &&
        reduxPage.list.map(ou => ({
            ...ou,
            color: searches[ou.search_index]
                ? searches[ou.search_index].color
                : null,
        }));
    let multiEditDisabled = false;
    if (!selection.selectAll && selection.selectedItems.length === 0) {
        multiEditDisabled = true;
    }
    const selectionActions = [
        {
            icon: <EditIcon />,
            label: formatMessage(MESSAGES.multiSelectionAction),
            onClick: () => setMultiActionPopupOpen(true),
            disabled: multiEditDisabled,
        },
    ];

    const defaultSource = useMemo(
        () => getDefaultSource(currentUser),
        [currentUser],
    );

    const getEndpointUrl = (
        toExport,
        exportType = 'csv',
        asLocation = false,
    ) => {
        searches.forEach((s, i) => {
            searches[i].orgUnitParentId = searches[i].levels;
            searches[i].dateFrom = getFromDateString(searches[i].dateFrom);
            searches[i].dateTo = getToDateString(searches[i].dateTo);
        });

        const urlParams = {
            ...params,
            limit: params.pageSize ? params.pageSize : 50,
            order: params.order ? params.order : '-updated_at',
            page: params.page ? params.page : 1,
            searches: encodeUriSearches(searches),
        };
        delete urlParams.tab;
        delete urlParams.searchActive;
        delete urlParams.pageSize;

        return getTableUrl(
            'orgunits',
            urlParams,
            toExport,
            exportType,
            asLocation,
        );
    };

    const fetchOrgUnits = useCallback(
        (withLocations = false) => {
            const url = getEndpointUrl();
            dispatch(setOrgUnitsListFetching(true));
            const promises = [fetchOrgUnitsList(dispatch, url)];
            setListUpdated(!withLocations);
            if (withLocations) {
                const urlLocation = getEndpointUrl(false, '', true);
                promises.push(fetchOrgUnitsList(dispatch, urlLocation));
            }
            Promise.all(promises).then(data => {
                if (!params.searchActive) {
                    const newParams = encodeUriParams(params);
                    newParams.searchActive = true;
                    dispatch(redirectTo(baseUrl, newParams));
                }
                dispatch(
                    setOrgUnits(
                        data[0].orgunits,
                        true,
                        params,
                        data[0].count,
                        data[0].pages,
                        data[0].counts,
                    ),
                );
                dispatch(setFiltersUpdated(false));
                if (withLocations) {
                    dispatch(
                        setOrgUnitsLocations(
                            mapOrgUnitByLocation(data[1], searches),
                        ),
                    );
                }
                dispatch(setOrgUnitsListFetching(false));
            });
        },
        [params.pageSize, params.order, params.page, searches],
    );

    const fetchOrgUnitsLocations = () => {
        dispatch(setOrgUnitsListFetching(true));
        const urlLocation = getEndpointUrl(false, '', true);
        fetchOrgUnitsList(dispatch, urlLocation).then(orgUnits => {
            dispatch(
                setOrgUnitsLocations(
                    mapOrgUnitByLocation(
                        orgUnits,
                        decodeSearch(params.searches),
                    ),
                ),
            );
            dispatch(setOrgUnitsListFetching(false));
        });
    };

    const onTabsDeleted = () => {
        dispatch(resetOrgUnits());
        dispatch(setFiltersUpdated(true));
    };

    const handleTableSelection = (
        selectionType,
        items = [],
        totalCount = 0,
    ) => {
        const newSelection = setTableSelection(
            selection,
            selectionType,
            items,
            totalCount,
        );
        setSelection(newSelection);
    };

    const onSearch = withLocations => {
        handleTableSelection('reset');
        const newParams = {
            ...params,
            page: 1,
        };
        setResetTablePage(convertObjectToString(newParams));
        dispatch(redirectTo(baseUrl, newParams));
        fetchOrgUnits(withLocations);
    };

    const handleChangeTab = (newtab, redirect = true) => {
        setTab(newtab);
        if (redirect) {
            const newParams = {
                ...params,
                tab,
            };
            dispatch(redirectTo(baseUrl, newParams));
        }

        if (
            tab === 'map' &&
            params.searchActive &&
            (filtersUpdated || listUpdated)
        ) {
            if (listUpdated) {
                setListUpdated(false);
            }
            fetchOrgUnitsLocations();
        }
    };

    useEffect(() => {
        fetchSources(dispatch).then(data => {
            const sources = [];
            data.forEach((s, i) => {
                sources.push({
                    ...s,
                    color: getChipColors(i),
                });
            });
            dispatch(setSources(sources));
            if (params.searchActive) {
                fetchOrgUnits(params.tab === 'map');
            }
            setShouldRenderFilters(true);
        });
        return () => {
            dispatch(setOrgUnits(null, true, params, 0, 1, []));
            dispatch(closeFixedSnackbar('locationLimitWarning'));
        };
    }, []);

    useEffect(() => {
        const newParams = {
            ...params,
            levels: null,
        };
        dispatch(redirectTo(baseUrl, newParams));
    }, [params.validation_status, params.validation_status]);

    useEffect(() => {
        if (
            (params.locationLimit <= locationLimitMax || tab !== 'map') &&
            warningDisplayed
        ) {
            setWarningDisplayed(false);
            dispatch(closeFixedSnackbar('locationLimitWarning'));
        }
        if (
            params.locationLimit > locationLimitMax &&
            tab === 'map' &&
            !warningDisplayed
        ) {
            setWarningDisplayed(true);
            dispatch(enqueueSnackbar(warningSnackBar('locationLimitWarning')));
        }
    }, [warningDisplayed, params.locationLimit, tab]);

    return (
        <>
            {(fetchingList || !shouldRenderFilters) && <LoadingSpinner />}
            <OrgUnitsMultiActionsDialog
                open={multiActionPopupOpen}
                params={params}
                closeDialog={() => setMultiActionPopupOpen(false)}
                fetchOrgUnits={() => fetchOrgUnits(false)}
                selection={selection}
            />
            <TopBar title={formatMessage(MESSAGES.title)}>
                <DynamicTabs
                    deleteMessage={MESSAGES.delete}
                    addMessage={MESSAGES.add}
                    baseLabel={formatMessage(MESSAGES.search)}
                    params={params}
                    defaultItem={{
                        validation_status: 'all',
                        color: getChipColors(searches.length + 1).replace(
                            '#',
                            '',
                        ),
                        source: defaultSource && defaultSource.id,
                    }}
                    paramKey="searches"
                    tabParamKey="searchTabIndex"
                    baseUrl={baseUrl}
                    redirectTo={(path, newParams) =>
                        dispatch(redirectTo(path, newParams))
                    }
                    onTabsUpdated={() => dispatch(setFiltersUpdated(true))}
                    onTabsDeleted={() => onTabsDeleted()}
                    maxItems={9}
                    counts={searchCounts}
                    displayCounts
                />
            </TopBar>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Box className={classes.containerFullHeightPadded}>
                        {shouldRenderFilters &&
                            decodeSearch(params.searches).map(
                                (s, searchIndex) => {
                                    const currentSearchIndex = parseInt(
                                        params.searchTabIndex,
                                        10,
                                    );
                                    return (
                                        <div
                                            key={searchIndex}
                                            className={
                                                searchIndex !==
                                                currentSearchIndex
                                                    ? classes.hiddenOpacity
                                                    : null
                                            }
                                        >
                                            <OrgUnitsFiltersComponent
                                                baseUrl={baseUrl}
                                                params={params}
                                                onSearch={() =>
                                                    onSearch(
                                                        params.tab === 'map',
                                                    )
                                                }
                                                currentTab={tab}
                                                searchIndex={searchIndex}
                                            />
                                        </div>
                                    );
                                },
                            )}
                        {params.searchActive && (
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
                                    <Table
                                        data={orgunits || []}
                                        pages={reduxPage.pages}
                                        defaultSorted={[
                                            { id: 'id', desc: false },
                                        ]}
                                        columns={tableColumns}
                                        count={reduxPage.count}
                                        baseUrl={baseUrl}
                                        params={params}
                                        marginTop={false}
                                        countOnTop={false}
                                        multiSelect
                                        selection={selection}
                                        selectionActions={selectionActions}
                                        redirectTo={(path, newParams) =>
                                            dispatch(
                                                redirectTo(path, newParams),
                                            )
                                        }
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
                                        resetPageToOne={resetTablePage}
                                    />
                                )}
                                {tab === 'map' && !fetchingOrgUnitTypes && (
                                    <div className={classes.containerMarginNeg}>
                                        <OrgunitsMap params={params} />
                                    </div>
                                )}
                                {tab === 'list' && reduxPage.count > 0 && (
                                    <Box
                                        mb={4}
                                        mt={1}
                                        display="flex"
                                        justifyContent="flex-end"
                                    >
                                        <DownloadButtonsComponent
                                            csvUrl={getEndpointUrl(true, 'csv')}
                                            xlsxUrl={getEndpointUrl(
                                                true,
                                                'xlsx',
                                            )}
                                            gpkgUrl={getEndpointUrl(
                                                true,
                                                'gpkg',
                                            )}
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};

OrgUnits.propTypes = {
    params: PropTypes.object.isRequired,
};

export default OrgUnits;
