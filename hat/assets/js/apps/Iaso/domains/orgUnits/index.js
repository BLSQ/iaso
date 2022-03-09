import React, { useState, useEffect, useMemo } from 'react';
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
    useSkipEffectOnMount,
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

import { decodeSearch, mapOrgUnitByLocation, encodeUriParams } from './utils';
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
import { useGetOrgUnitTypes} from './hooks';

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
    const { data: orgUnitTypes,isFetching: fetchingOrgUnitTypes } = useGetOrgUnitTypes()
    // const fetchingOrgUnitTypes = useSelector(
    //     state => state.orgUnits.fetchingOrgUnitTypes,
    // );
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

    const multiEditDisabled =
        !selection.selectAll && selection.selectedItems.length === 0;

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

    const defaultSource = useMemo(
        () => currentUser?.account?.default_version?.data_source,
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
            searches: JSON.stringify(searches),
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

    const fetchOrgUnits = () => {
        const withLocations = params.tab === 'map';
        const url = getEndpointUrl();
        dispatch(setOrgUnitsListFetching(true));
        const promises = [fetchOrgUnitsList(dispatch, url)];
        setListUpdated(!withLocations);
        if (withLocations) {
            const urlLocation = getEndpointUrl(false, '', true);
            promises.push(fetchOrgUnitsList(dispatch, urlLocation));
        }

        Promise.all(promises)
            .then(data => {
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
            })
            // eslint-disable-next-line no-unused-vars
            .catch(_error => {
                dispatch(setOrgUnitsListFetching(false));
            });
    };

    const fetchOrgUnitsLocations = () => {
        dispatch(setOrgUnitsListFetching(true));
        const urlLocation = getEndpointUrl(false, '', true);
        fetchOrgUnitsList(dispatch, urlLocation).then(orgUnits => {
            dispatch(
                setOrgUnitsLocations(mapOrgUnitByLocation(orgUnits, searches)),
            );
            dispatch(setOrgUnitsListFetching(false));
        });
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

    const onSearch = newParams => {
        handleTableSelection('reset');
        setResetTablePage(convertObjectToString(newParams));
        dispatch(redirectTo(baseUrl, newParams));
        if (!filtersUpdated && !params.searchActive) {
            fetchOrgUnits();
        }
    };

    const onTabsDeleted = newParams => {
        dispatch(resetOrgUnits());
        dispatch(setFiltersUpdated(true));
        onSearch({ ...newParams, page: 1 });
    };

    useEffect(() => {
        dispatch(setFiltersUpdated(false));
    }, []);

    useSkipEffectOnMount(() => {
        if (!filtersUpdated) {
            fetchOrgUnits();
        }
    }, [params.pageSize, params.order, params.page]);

    useSkipEffectOnMount(() => {
        if (filtersUpdated) {
            fetchOrgUnits();
        }
    }, [searches]);

    const handleChangeTab = newtab => {
        setTab(newtab);
        const newParams = {
            ...params,
            tab: newtab,
        };
        dispatch(redirectTo(baseUrl, newParams));
        if (
            newtab === 'map' &&
            params.searchActive &&
            (filtersUpdated || listUpdated)
        ) {
            if (listUpdated) {
                setListUpdated(false);
            }

            dispatch(
                setOrgUnitsLocations({
                    locations: [],
                    shapes: [],
                }),
            );
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
                fetchOrgUnits();
            }
            setShouldRenderFilters(true);
        });
        return () => {
            dispatch(setOrgUnits(null, true, params, 0, 1, []));
            dispatch(closeFixedSnackbar('locationLimitWarning'));
        };
        // Leaving empty to run the effect only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const newParams = {
            ...params,
            levels: null,
        };
        dispatch(redirectTo(baseUrl, newParams));
        // TODO test if adding params to the deps array breaks anything.
        // diabling es-lint rule in the meantime
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.validation_status]);

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
            <OrgUnitsMultiActionsDialog
                open={multiActionPopupOpen}
                params={params}
                closeDialog={() => setMultiActionPopupOpen(false)}
                fetchOrgUnits={() => fetchOrgUnits()}
                selection={selection}
            />
            {(fetchingList || !shouldRenderFilters) && (
                <LoadingSpinner fixed={false} absolute />
            )}
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
                    onTabsUpdated={newParams =>
                        dispatch(redirectTo(baseUrl, newParams))
                    }
                    onTabChange={newParams =>
                        dispatch(redirectTo(baseUrl, newParams))
                    }
                    onTabsDeleted={onTabsDeleted}
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
                                                onSearch={onSearch}
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
                                {!fetchingOrgUnitTypes && (
                                    <div
                                        className={
                                            tab === 'map'
                                                ? ''
                                                : classes.hiddenOpacity
                                        }
                                    >
                                        <div
                                            className={
                                                classes.containerMarginNeg
                                            }
                                        >
                                            <OrgunitsMap params={params}  />
                                        </div>
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
