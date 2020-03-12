import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import {
    withStyles,
    Grid,
    Box,
    Tabs,
    Tab,
} from '@material-ui/core';

import PropTypes from 'prop-types';

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

import { createUrl } from '../../../../utils/fetchData';
import { fetchLatestOrgUnitLevelId } from './utils';
import getTableUrl from '../../utils/tableUtils';

import DownloadButtonsComponent from '../../components/buttons/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import CustomTableComponent from '../../../../components/CustomTableComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import OrgUnitsFiltersComponent from './components/OrgUnitsFiltersComponent';
import OrgunitsMap from './components/OrgunitsMapComponent';

import commonStyles from '../../styles/common';
import chipColors from '../../constants/chipColors';

import { warningSnackBar } from '../../../../utils/constants/snackBars';
import { enqueueSnackbar, closeFixedSnackbar } from '../../../../redux/snackBarsReducer';

import DynamicTabsComponent from '../../components/nav/DynamicTabsComponent';

const baseUrl = 'orgunits';
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

const mapOrgUnitBySearch = (orgUnits, searches) => {
    const mappedOrgunits = [];
    searches.forEach((search, i) => {
        mappedOrgunits[i] = orgUnits.filter(o => o.search_index === i);
    });
    return mappedOrgunits;
};

const mapOrgUnitByLocation = (orgUnits, searches) => {
    const mappedOrgunits = {
        shapes: [],
        locations: [],
    };
    orgUnits.forEach((o) => {
        if (o.latitude && o.longitude) {
            mappedOrgunits.locations.push(o);
        }
        if (o.geo_json) {
            mappedOrgunits.shapes.push(o);
        }
    });
    mappedOrgunits.locations = mapOrgUnitBySearch(mappedOrgunits.locations, searches);
    return mappedOrgunits;
};

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: props.params.tab ? props.params.tab : 'list',
            listUpdated: false,
        };
    }

    componentWillMount() {
        const {
            dispatch,
            params,
        } = this.props;
        this.props.resetOrgUnitsLevels();

        dispatch(this.props.setFetchingOrgUnitTypes(true));
        fetchOrgUnitsTypes(dispatch).then((orgUnitTypes) => {
            this.props.setOrgUnitTypes(orgUnitTypes);
            dispatch(this.props.setFetchingOrgUnitTypes(false));
        });

        fetchSources(dispatch)
            .then((data) => {
                const sources = [];
                data.forEach((s, i) => {
                    sources.push({
                        ...s,
                        color: chipColors[i],
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
        const validatedChanged = prevProps.params.validated !== this.props.params.validated;
        const sourceChanged = prevProps.params.source !== this.props.params.source;
        if (validatedChanged || sourceChanged) {
            const newParams = {
                ...this.props.params,
            };
            newParams.levels = null;
            this.props.redirectTo(baseUrl, newParams);
        }
        const {
            params,
            dispatch,
        } = this.props;
        const {
            tab,
        } = this.state;
        if (params.pageSize !== prevProps.params.pageSize
            || params.order !== prevProps.params.order
            || params.page !== prevProps.params.page) {
            this.fetchOrgUnits(false);
        }
        if ((params.locationLimit <= locationLimitMax || tab !== 'map') && warningDisplayed) {
            warningDisplayed = false;
            dispatch(closeFixedSnackbar('locationLimitWarning'));
        }
        if ((params.locationLimit > locationLimitMax && tab === 'map') && !warningDisplayed) {
            warningDisplayed = true;
            dispatch(enqueueSnackbar(warningSnackBar('locationLimitWarning')));
        }
    }

    componentWillUnmount() {
        const {
            dispatch,
        } = this.props;
        this.props.setOrgUnits(null, this.props.params, 0, 1, []);
        dispatch(closeFixedSnackbar('locationLimitWarning'));
    }

    onTabsDeleted() {
        this.props.setFiltersUpdated(true);
        this.props.resetOrgUnits();
    }

    getEndpointUrl(toExport, exportType = 'csv', asLocation = false) {
        const {
            params,
        } = this.props;

        const searches = JSON.parse(params.searches);
        searches.forEach((s, i) => {
            searches[i].orgUnitParentId = searches[i].levels ? fetchLatestOrgUnitLevelId(searches[i].levels) : null;
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

        return getTableUrl('orgunits', urlParams, toExport, exportType, asLocation);
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

        if (tab === 'map' && params.searchActive && (filtersUpdated || listUpdated)) {
            if (listUpdated) {
                newState.listUpdated = false;
            }
            this.fetchOrgUnitsLocations();
        }
        this.setState(newState);
    }

    selectOrgUnit(orgUnit, tab) {
        const { redirectTo } = this.props;
        const newParams = {
            orgUnitId: orgUnit.id,
            tab,
        };
        redirectTo('orgunits/detail', newParams);
    }

    fetchOrgUnitsLocations() {
        const {
            dispatch,
            params,
        } = this.props;
        dispatch(this.props.setOrgUnitsListFetching(true));
        const urlLocation = this.getEndpointUrl(false, '', true);
        fetchOrgUnitsList(dispatch, urlLocation).then((orgUnits) => {
            this.props.setOrgUnitsLocations(
                mapOrgUnitByLocation(
                    orgUnits,
                    JSON.parse(params.searches),
                ),
            );
            dispatch(this.props.setOrgUnitsListFetching(false));
        });
    }

    fetchOrgUnits(withLocations = true) {
        const {
            params,
            dispatch,
        } = this.props;

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
        this.props.setOrgUnits(null, params, 0, 1, []);
        Promise.all(promises).then((data) => {
            if (!params.searchActive) {
                const newParams = {
                    ...params,
                };
                newParams.searchActive = true;
                this.props.redirectTo(baseUrl, newParams);
            }
            this.props.setOrgUnits(data[0].orgunits, params, data[0].count, data[0].pages, data[0].counts);
            this.props.setFiltersUpdated(false);
            if (withLocations) {
                this.props.setOrgUnitsLocations(mapOrgUnitByLocation(
                    data[1],
                    JSON.parse(params.searches),
                ));
            }
            dispatch(this.props.setOrgUnitsListFetching(false));
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: {
                formatMessage,
            },
            orgUnitTypes,
            sources,
            fetchingList,
            fetchingOrgUnitTypes,
            redirectTo,
            searchCounts,
        } = this.props;
        const {
            tab,
        } = this.state;
        const tableColumns = orgUnitsTableColumns(
            formatMessage,
            this,
            classes,
            JSON.parse(params.searches),
        );
        return (
            <Fragment>
                {
                    fetchingList
                    && <LoadingSpinner />
                }
                <TopBar title={formatMessage({
                    defaultMessage: 'Org units',
                    id: 'iaso.orgUnits.title',
                })}
                >
                    <DynamicTabsComponent
                        baseLabel={formatMessage({
                            defaultMessage: 'Search',
                            id: 'iaso.label.search',
                        })}
                        params={params}
                        defaultItem={{ validated: 'both', color: chipColors[0].replace('#', '') }}
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
                    {
                        JSON.parse(params.searches).map((s, searchIndex) => {
                            const currentSearchIndex = parseInt(params.searchTabIndex, 10);
                            return (
                                <div key={searchIndex} className={searchIndex !== currentSearchIndex ? classes.hiddenOpacity : null}>
                                    <OrgUnitsFiltersComponent
                                        baseUrl={baseUrl}
                                        params={params}
                                        onSearch={() => this.fetchOrgUnits(params.tab === 'map')}
                                        orgUnitTypes={orgUnitTypes}
                                        sources={sources}
                                        currentTab={tab}
                                        searchIndex={searchIndex}
                                    />
                                </div>
                            );
                        })
                    }
                    {
                        params.searchActive
                        && (
                            <Fragment>
                                <Tabs
                                    value={tab}
                                    classes={{
                                        root: classes.tabs,
                                    }}
                                    className={classes.marginBottom}
                                    indicatorColor="primary"
                                    onChange={(event, newtab) => this.handleChangeTab(newtab)
                                    }
                                >
                                    <Tab
                                        value="list"
                                        label={formatMessage({
                                            defaultMessage: 'List',
                                            id: 'iaso.label.list',
                                        })}
                                    />
                                    <Tab
                                        value="map"
                                        label={formatMessage({
                                            defaultMessage: 'Map',
                                            id: 'iaso.label.map',
                                        })}
                                    />
                                </Tabs>
                                {
                                    tab === 'list' && (
                                        <div className={classes.reactTable}>
                                            <CustomTableComponent
                                                isSortable
                                                pageSize={50}
                                                showPagination
                                                columns={tableColumns}
                                                defaultSorted={[{ id: 'id', desc: false }]}
                                                params={params}
                                                defaultPath={baseUrl}
                                                dataKey="orgunits"
                                                fetchDatas={false}
                                                canSelect={false}
                                                multiSort
                                                reduxPage={reduxPage}
                                            />
                                        </div>
                                    )
                                }
                                {
                                    tab === 'map'
                                    && !fetchingOrgUnitTypes
                                    && (
                                        <div className={classes.containerMarginNeg}>
                                            <OrgunitsMap
                                                params={params}
                                                baseUrl={baseUrl}
                                                setFiltersUpdated={() => this.props.setFiltersUpdated(true)}
                                            />
                                        </div>
                                    )
                                }
                                {tab === 'list'
                                    && (
                                        <Grid container spacing={0} alignItems="center" className={classes.marginTop}>
                                            <Grid xs={12} item className={classes.textAlignRight}>
                                                <div className={classes.paddingBottomBig}>
                                                    <DownloadButtonsComponent
                                                        csvUrl={this.getEndpointUrl(true, 'csv')}
                                                        xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                                    />
                                                </div>
                                            </Grid>
                                        </Grid>
                                    )}
                            </Fragment>
                        )
                    }
                </Box>
            </Fragment>
        );
    }
}
OrgUnits.defaultProps = {
    reduxPage: undefined,
    sources: [],
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
    orgUnitTypes: PropTypes.array.isRequired,
    setSources: PropTypes.func.isRequired,
    sources: PropTypes.array,
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
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
    fetchingList: state.orgUnits.fetchingList,
    fetchingOrgUnitTypes: state.orgUnits.fetchingOrgUnitTypes,
    filtersUpdated: state.orgUnits.filtersUpdated,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages, counts) => dispatch(setOrgUnits(orgUnitsList, true, params, count, pages, counts)),
    resetOrgUnits: () => dispatch(resetOrgUnits()),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSources: sources => dispatch(setSources(sources)),
    setOrgUnitsListFetching: isFetching => dispatch(setOrgUnitsListFetching(isFetching)),
    setFetchingOrgUnitTypes: isFetching => dispatch(setFetchingOrgUnitTypes(isFetching)),
    setOrgUnitsLocations: orgUnitsList => dispatch(setOrgUnitsLocations(orgUnitsList)),
    setFiltersUpdated: filtersUpdated => dispatch(setFiltersUpdated(filtersUpdated)),
    setGroups: groups => dispatch(setGroups(groups)),
    resetOrgUnitsLevels: () => dispatch(resetOrgUnitsLevels()),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
