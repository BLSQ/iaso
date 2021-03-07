import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import moment from 'moment';
import { withStyles, Grid, Box, Tabs, Tab } from '@material-ui/core';

import PropTypes from 'prop-types';

import EditIcon from '@material-ui/icons/Edit';

import {
    fetchOrgUnitsTypes,
    fetchSources,
    fetchOrgUnitsList,
    fetchGroups,
} from '../../utils/requests';

import {
    setOrgUnits,
    setOrgUnitsLocations,
    setOrgUnitTypes,
    setOrgUnitsListFetching,
    setSources,
    setFetchingOrgUnitTypes,
    setFiltersUpdated,
    setGroups,
    resetOrgUnits,
} from './actions';
import { resetOrgUnitsLevels } from '../../redux/orgUnitsLevelsReducer';

import { orgUnitsTableColumns } from './config';

import { createUrl } from '../../utils/fetchData';
import {
    fetchLatestOrgUnitLevelId,
    decodeSearch,
    mapOrgUnitByLocation,
    encodeUriParams,
    encodeUriSearches,
} from './utils';
import getTableUrl, {
    selectionInitialState,
    setTableSelection,
} from '../../utils/tableUtils';

import DownloadButtonsComponent from '../../components/buttons/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import OrgUnitsFiltersComponent from './components/OrgUnitsFiltersComponent';
import OrgunitsMap from './components/OrgunitsMapComponent';
import OrgUnitsMultiActionsDialog from './components/OrgUnitsMultiActionsDialog';
import Table from '../../components/tables/TableComponent';

import commonStyles from '../../styles/common';
import { getChipColors } from '../../constants/chipColors';

import { warningSnackBar } from '../../constants/snackBars';
import {
    enqueueSnackbar,
    closeFixedSnackbar,
} from '../../redux/snackBarsReducer';

import DynamicTabsComponent from '../../components/nav/DynamicTabsComponent';

import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import injectIntl from '../../libs/intl/injectIntl';

const baseUrl = baseUrls.orgUnits;
let warningDisplayed = false;
export const locationLimitMax = 3000;

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
});

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: props.params.tab ? props.params.tab : 'list',
            listUpdated: false,
            multiActionPopupOpen: false,
            selection: selectionInitialState,
        };
    }

    componentWillMount() {
        const { dispatch, params } = this.props;
        this.props.resetOrgUnitsLevels();

        dispatch(this.props.setFetchingOrgUnitTypes(true));
        fetchOrgUnitsTypes(dispatch).then(orgUnitTypes => {
            this.props.setOrgUnitTypes(orgUnitTypes);
            dispatch(this.props.setFetchingOrgUnitTypes(false));
        });

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
        });
        fetchGroups(dispatch).then(groups => this.props.setGroups(groups));
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
        // console.log(searches);
        searches.forEach((s, i) => {
            searches[i].orgUnitParentId = searches[i].levels
                ? fetchLatestOrgUnitLevelId(searches[i].levels)
                : null;

            searches[i].dateFrom =
                searches[i].dateFrom !== null ||
                searches[i].dateFrom !== undefined
                    ? moment(searches[i].dateFrom)
                          .startOf('day')
                          .format('YYYY-MM-DD HH:MM')
                    : undefined;

            searches[i].dateTo =
                searches[i].dateTo !== null || searches[i].dateTo !== undefined
                    ? moment(searches[i].dateTo)
                          .endOf('day')
                          .format('YYYY-MM-DD HH:MM')
                    : undefined;
        });
        // console.log(searches);
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
        } = this.props;

        const {
            tab,
            multiActionPopupOpen,
            selection,
            selection: { selectedItems, selectAll },
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
        return (
            <>
                {fetchingList && <LoadingSpinner />}
                <OrgUnitsMultiActionsDialog
                    open={multiActionPopupOpen}
                    params={params}
                    closeDialog={() => this.setMultiActionsPopupOpen(false)}
                    fetchOrgUnits={() => this.fetchOrgUnits(false)}
                    selection={selection}
                />
                <TopBar title={formatMessage(MESSAGES.title)}>
                    <DynamicTabsComponent
                        baseLabel={formatMessage(MESSAGES.search)}
                        params={params}
                        defaultItem={{
                            validation_status: 'all',
                            color: getChipColors(0).replace('#', ''),
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
                    {decodeSearch(params.searches).map((s, searchIndex) => {
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
    setOrgUnitTypes: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitsListFetching: PropTypes.func.isRequired,
    setFetchingOrgUnitTypes: PropTypes.func.isRequired,
    fetchingList: PropTypes.bool.isRequired,
    setOrgUnitsLocations: PropTypes.func.isRequired,
    fetchingOrgUnitTypes: PropTypes.bool.isRequired,
    filtersUpdated: PropTypes.bool.isRequired,
    setFiltersUpdated: PropTypes.func.isRequired,
    setGroups: PropTypes.func.isRequired,
    resetOrgUnitsLevels: PropTypes.func.isRequired,
    searchCounts: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
    searchCounts: state.orgUnits.orgUnitsPage.counts,
    fetchingList: state.orgUnits.fetchingList,
    fetchingOrgUnitTypes: state.orgUnits.fetchingOrgUnitTypes,
    filtersUpdated: state.orgUnits.filtersUpdated,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages, counts) =>
        dispatch(setOrgUnits(orgUnitsList, true, params, count, pages, counts)),
    resetOrgUnits: () => dispatch(resetOrgUnits()),
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSources: sources => dispatch(setSources(sources)),
    setOrgUnitsListFetching: isFetching =>
        dispatch(setOrgUnitsListFetching(isFetching)),
    setFetchingOrgUnitTypes: isFetching =>
        dispatch(setFetchingOrgUnitTypes(isFetching)),
    setOrgUnitsLocations: orgUnitsList =>
        dispatch(setOrgUnitsLocations(orgUnitsList)),
    setFiltersUpdated: filtersUpdated =>
        dispatch(setFiltersUpdated(filtersUpdated)),
    setGroups: groups => dispatch(setGroups(groups)),
    resetOrgUnitsLevels: () => dispatch(resetOrgUnitsLevels()),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
