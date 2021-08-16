import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { withStyles, Box, Tabs, Tab } from '@material-ui/core';

import PropTypes from 'prop-types';

import EditIcon from '@material-ui/icons/Edit';

import {
    DynamicTabs,
    createUrl,
    getTableUrl,
    selectionInitialState,
    setTableSelection,
    commonStyles,
    injectIntl,
    Table,
} from 'bluesquare-components';

import { ErrorBoundary } from 'bluesquare-components/dist/components/ErrorBoundary';
import { fetchSources, fetchOrgUnitsList } from '../../utils/requests';

import {
    setOrgUnits,
    setOrgUnitsLocations,
    setOrgUnitsListFetching,
    setSources,
    setFiltersUpdated,
    resetOrgUnits,
} from './actions';

import { orgUnitsTableColumns } from './config';

import {
    fetchLatestOrgUnitLevelId,
    decodeSearch,
    mapOrgUnitByLocation,
    encodeUriParams,
    encodeUriSearches,
} from './utils';
import { getFromDateString, getToDateString } from '../../utils/dates';

import DownloadButtonsComponent from '../../components/buttons/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
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

const baseUrl = baseUrls.orgUnits;
let warningDisplayed = false;

const styles = theme => ({
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
});

const getDefaultSource = currentUser =>
    currentUser &&
    currentUser.account &&
    currentUser.account.default_version &&
    currentUser.account.default_version.data_source;

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: props.params.tab ? props.params.tab : 'list',
            listUpdated: false,
            multiActionPopupOpen: false,
            selection: selectionInitialState,
            shouldRenderFilters: false,
        };
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        const { dispatch, params, currentUser } = this.props;

        fetchSources(dispatch).then(data => {
            const sources = [];
            data.forEach((s, i) => {
                sources.push({
                    ...s,
                    color: getChipColors(i),
                });
            });
            this.props.setSources(sources);
            if (this.props.params.searchActive) {
                this.fetchOrgUnits(params.tab === 'map');
            }
            const searches = decodeSearch(params.searches);
            let needRedirect = false;
            const defaultSource = getDefaultSource(currentUser);
            searches.forEach((search, index) => {
                if (!search.source && defaultSource) {
                    searches[index].source = defaultSource.id;
                    needRedirect = true;
                }
            });
            if (needRedirect) {
                const newParams = {
                    ...params,
                    searches: encodeUriSearches(searches),
                };
                this.props.redirectTo(baseUrl, newParams);
            }
            this.setState({
                shouldRenderFilters: true,
            });
        });
    }

    componentDidUpdate(prevProps) {
        const validationStatusChanged =
            prevProps.params.validation_status !==
            this.props.params.validation_status;
        const sourceChanged =
            prevProps.params.source !== this.props.params.source;
        if (validationStatusChanged || sourceChanged) {
            const newParams = {
                ...this.props.params,
            };
            newParams.levels = null;
            this.props.redirectTo(baseUrl, newParams);
        }
        const { params, dispatch } = this.props;
        const { tab } = this.state;
        if (
            params.pageSize !== prevProps.params.pageSize ||
            params.order !== prevProps.params.order ||
            params.page !== prevProps.params.page
        ) {
            this.fetchOrgUnits(false);
        }
        if (
            (params.locationLimit <= locationLimitMax || tab !== 'map') &&
            warningDisplayed
        ) {
            warningDisplayed = false;
            dispatch(closeFixedSnackbar('locationLimitWarning'));
        }
        if (
            params.locationLimit > locationLimitMax &&
            tab === 'map' &&
            !warningDisplayed
        ) {
            warningDisplayed = true;
            dispatch(enqueueSnackbar(warningSnackBar('locationLimitWarning')));
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        this.props.setOrgUnits(null, this.props.params, 0, 1, []);
        dispatch(closeFixedSnackbar('locationLimitWarning'));
    }

    handleTableSelection(selectionType, items = [], totalCount = 0) {
        const { selection } = this.state;
        const newSelection = setTableSelection(
            selection,
            selectionType,
            items,
            totalCount,
        );
        this.setState({
            selection: newSelection,
        });
    }

    handleChangeTab(tab, redirect = true) {
        const { redirectTo, params, filtersUpdated } = this.props;
        const { listUpdated } = this.state;
        const newState = {
            ...this.state,
            tab,
        };
        if (redirect) {
            const newParams = {
                ...params,
                tab,
            };
            redirectTo(baseUrl, newParams);
        }

        if (
            tab === 'map' &&
            params.searchActive &&
            (filtersUpdated || listUpdated)
        ) {
            if (listUpdated) {
                newState.listUpdated = false;
            }
            this.fetchOrgUnitsLocations();
        }
        this.setState(newState);
    }

    onTabsDeleted() {
        this.props.resetOrgUnits();
        this.props.setFiltersUpdated(true);
    }

    onSearch(withLocations) {
        const { redirectTo, params } = this.props;
        this.handleTableSelection('reset');

        const newParams = {
            ...params,
            page: 1,
        };
        redirectTo(baseUrl, newParams);
        this.fetchOrgUnits(withLocations);
    }

    getEndpointUrl(toExport, exportType = 'csv', asLocation = false) {
        const { params } = this.props;
        const searches = decodeSearch(params.searches);

        searches.forEach((s, i) => {
            searches[i].orgUnitParentId = searches[i].levels
                ? fetchLatestOrgUnitLevelId(searches[i].levels)
                : null;

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
    }

    setMultiActionsPopupOpen(multiActionPopupOpen) {
        this.setState({
            multiActionPopupOpen,
        });
    }

    fetchOrgUnitsLocations() {
        const { dispatch, params } = this.props;
        dispatch(this.props.setOrgUnitsListFetching(true));
        const urlLocation = this.getEndpointUrl(false, '', true);
        fetchOrgUnitsList(dispatch, urlLocation).then(orgUnits => {
            this.props.setOrgUnitsLocations(
                mapOrgUnitByLocation(orgUnits, decodeSearch(params.searches)),
            );
            dispatch(this.props.setOrgUnitsListFetching(false));
        });
    }

    fetchOrgUnits(withLocations = true) {
        const { params, dispatch } = this.props;
        const url = this.getEndpointUrl();
        dispatch(this.props.setOrgUnitsListFetching(true));
        const promises = [fetchOrgUnitsList(dispatch, url)];
        this.setState({
            listUpdated: !withLocations,
        });
        if (withLocations) {
            const urlLocation = this.getEndpointUrl(false, '', true);
            promises.push(fetchOrgUnitsList(dispatch, urlLocation));
        }
        Promise.all(promises).then(data => {
            if (!params.searchActive) {
                const newParams = encodeUriParams(params);
                newParams.searchActive = true;
                this.props.redirectTo(baseUrl, newParams);
            }
            this.props.setOrgUnits(
                data[0].orgunits,
                params,
                data[0].count,
                data[0].pages,
                data[0].counts,
            );
            this.props.setFiltersUpdated(false);
            if (withLocations) {
                this.props.setOrgUnitsLocations(
                    mapOrgUnitByLocation(
                        data[1],
                        decodeSearch(params.searches),
                    ),
                );
            }
            dispatch(this.props.setOrgUnitsListFetching(false));
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: { formatMessage },
            fetchingList,
            fetchingOrgUnitTypes,
            redirectTo,
            searchCounts,
            currentUser,
        } = this.props;

        const {
            tab,
            multiActionPopupOpen,
            selection,
            selection: { selectedItems, selectAll },
            shouldRenderFilters,
        } = this.state;
        const tableColumns = orgUnitsTableColumns(
            formatMessage,
            classes,
            decodeSearch(params.searches),
        );

        const searches = decodeSearch(params.searches);
        const orgunits =
            reduxPage.list &&
            reduxPage.list.map(ou => ({
                ...ou,
                color: searches[ou.search_index]
                    ? searches[ou.search_index].color
                    : null,
            }));
        let multiEditDisabled = false;
        if (!selectAll && selectedItems.length === 0) {
            multiEditDisabled = true;
        }
        const selectionActions = [
            {
                icon: <EditIcon />,
                label: formatMessage(MESSAGES.multiSelectionAction),
                onClick: () => this.setMultiActionsPopupOpen(true),
                disabled: multiEditDisabled,
            },
        ];

        const defaultSource = getDefaultSource(currentUser);
        return (
            <>
                {(fetchingList || !shouldRenderFilters) && <LoadingSpinner />}
                <OrgUnitsMultiActionsDialog
                    open={multiActionPopupOpen}
                    params={params}
                    closeDialog={() => this.setMultiActionsPopupOpen(false)}
                    fetchOrgUnits={() => this.fetchOrgUnits(false)}
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
                            color: getChipColors(0).replace('#', ''),
                            source: defaultSource && defaultSource.id,
                        }}
                        paramKey="searches"
                        tabParamKey="searchTabIndex"
                        baseUrl={baseUrl}
                        redirectTo={redirectTo}
                        onTabsUpdated={() => this.props.setFiltersUpdated(true)}
                        onTabsDeleted={() => this.onTabsDeleted()}
                        maxItems={9}
                        counts={searchCounts}
                        displayCounts
                    />
                </TopBar>
                <Box className={classes.containerFullHeightPadded}>
                    {shouldRenderFilters &&
                        decodeSearch(params.searches).map((s, searchIndex) => {
                            const currentSearchIndex = parseInt(
                                params.searchTabIndex,
                                10,
                            );
                            return (
                                <div
                                    key={searchIndex}
                                    className={
                                        searchIndex !== currentSearchIndex
                                            ? classes.hiddenOpacity
                                            : null
                                    }
                                >
                                    <OrgUnitsFiltersComponent
                                        baseUrl={baseUrl}
                                        params={params}
                                        onSearch={() =>
                                            this.onSearch(params.tab === 'map')
                                        }
                                        currentTab={tab}
                                        searchIndex={searchIndex}
                                    />
                                </div>
                            );
                        })}
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
                                    this.handleChangeTab(newtab)
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
                                    defaultSorted={[{ id: 'id', desc: false }]}
                                    columns={tableColumns}
                                    count={reduxPage.count}
                                    baseUrl={baseUrl}
                                    params={params}
                                    marginTop={false}
                                    countOnTop={false}
                                    multiSelect
                                    selection={selection}
                                    selectionActions={selectionActions}
                                    redirectTo={redirectTo}
                                    setTableSelection={(
                                        selectionType,
                                        items,
                                        totalCount,
                                    ) =>
                                        this.handleTableSelection(
                                            selectionType,
                                            items,
                                            totalCount,
                                        )
                                    }
                                />
                            )}
                            {tab === 'map' && !fetchingOrgUnitTypes && (
                                <div className={classes.containerMarginNeg}>
                                    <OrgunitsMap
                                        params={params}
                                        baseUrl={baseUrl}
                                        setFiltersUpdated={() =>
                                            this.props.setFiltersUpdated(true)
                                        }
                                    />
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
                                        csvUrl={this.getEndpointUrl(
                                            true,
                                            'csv',
                                        )}
                                        xlsxUrl={this.getEndpointUrl(
                                            true,
                                            'xlsx',
                                        )}
                                        gpkgUrl={this.getEndpointUrl(
                                            true,
                                            'gpkg',
                                        )}
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </>
        );
    }
}
OrgUnits.defaultProps = {
    reduxPage: undefined,
};

OrgUnits.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setOrgUnits: PropTypes.func.isRequired,
    resetOrgUnits: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitsListFetching: PropTypes.func.isRequired,
    fetchingList: PropTypes.bool.isRequired,
    setOrgUnitsLocations: PropTypes.func.isRequired,
    fetchingOrgUnitTypes: PropTypes.bool.isRequired,
    filtersUpdated: PropTypes.bool.isRequired,
    setFiltersUpdated: PropTypes.func.isRequired,
    searchCounts: PropTypes.array.isRequired,
    currentUser: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
    searchCounts: state.orgUnits.orgUnitsPage.counts,
    fetchingList: state.orgUnits.fetchingList,
    fetchingOrgUnitTypes: state.orgUnits.fetchingOrgUnitTypes,
    filtersUpdated: state.orgUnits.filtersUpdated,
    currentUser: state.users.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages, counts) =>
        dispatch(setOrgUnits(orgUnitsList, true, params, count, pages, counts)),
    resetOrgUnits: () => dispatch(resetOrgUnits()),
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    setSources: sources => dispatch(setSources(sources)),
    setOrgUnitsListFetching: isFetching =>
        dispatch(setOrgUnitsListFetching(isFetching)),
    setOrgUnitsLocations: orgUnitsList =>
        dispatch(setOrgUnitsLocations(orgUnitsList)),
    setFiltersUpdated: filtersUpdated =>
        dispatch(setFiltersUpdated(filtersUpdated)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
