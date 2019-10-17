import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import {
    withStyles,
    Grid,
    Paper,
    Tabs,
    Tab,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchOrgUnitsTypes,
    fetchSources,
    fetchOrgUnitsList,
} from '../utils/requests';

import {
    setOrgUnits,
    setOrgUnitsLocations,
    setOrgUnitTypes,
    setOrgUnitsListFetching,
    setSources,
    setFetchingOrgUnitTypes,
} from '../redux/orgUnitsReducer';

import orgUnitsTableColumns from '../constants/orgUnitsTableColumns';

import { createUrl } from '../../../utils/fetchData';
import { fetchLatestOrgUnitLevelId } from '../utils/orgUnitUtils';

import DownloadButtonsComponent from '../components/buttons/DownloadButtonsComponent';
import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import OrgUnitsFiltersComponent from '../components/filters/OrgUnitsFiltersComponent';
import OrgunitsMap from '../components/maps/OrgunitsMapComponent';

import commonStyles from '../styles/common';
import reactTable from '../styles/reactTable';
import chipColors from '../constants/chipColors';

import { warningSnackBar } from '../components/snackBars';
import { enqueueSnackbar, closeFixedSnackbar } from '../../../redux/snackBarsReducer';

const baseUrl = 'orgunits';
let warningDisplayed = false;
export const locationLimitMax = 3000;

const styles = theme => ({
    ...commonStyles(theme),
    paperContainer: {
        ...commonStyles(theme).paperContainer,
        marginTop: 0,
        paddingBottom: 0,
    },
    reactTable: {
        ...reactTable(theme).reactTable,
    },
    buttonIcon: {
        marginRight: theme.spacing(1),
        width: 15,
        height: 15,
    },
    tableButton: {
        marginRight: theme.spacing(2),
    },
});

const mapOrgUnitByLocation = (orgUnits) => {
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
    return mappedOrgunits;
};

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: orgUnitsTableColumns(props.intl.formatMessage, this),
            tab: props.params.tab ? props.params.tab : 'list',
            hasLocations: false,
        };
    }

    componentWillMount() {
        const {
            dispatch,
            params,
        } = this.props;
        if (this.props.params.searchActive) {
            this.fetchOrgUnits(params.tab === 'map');
        }

        dispatch(this.props.setFetchingOrgUnitTypes(true));
        fetchOrgUnitsTypes(this.props.dispatch).then((orgUnitTypes) => {
            this.props.setOrgUnitTypes(orgUnitTypes);
            dispatch(this.props.setFetchingOrgUnitTypes(false));
        });

        fetchSources(this.props.dispatch)
            .then((data) => {
                const sources = [];
                data.forEach((s, i) => {
                    sources.push({
                        ...s,
                        color: chipColors[i],
                    });
                });
                this.props.setSources(sources);
            });
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
        this.props.setOrgUnits(null, this.props.params, 0, 1);
        dispatch(closeFixedSnackbar('locationLimitWarning'));
    }

    getEndpointUrl(toExport, exportType = 'csv', asLocation = false) {
        let url = '/api/orgunits/?';
        const {
            params,
        } = this.props;

        const urlParams = {
            ...params,
            limit: params.pageSize ? params.pageSize : 50,
            order: params.order ? params.order : '-updated_at',
            page: params.page ? params.page : 1,
        };

        if (toExport) {
            urlParams[exportType] = true;
        }
        if (asLocation) {
            urlParams.asLocation = true;
            urlParams.limit = params.locationLimit ? params.locationLimit : locationLimitMax;
            delete urlParams.page;
        }
        delete urlParams.tab;
        delete urlParams.searchActive;
        delete urlParams.pageSize;

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                if (key === 'levels') {
                    url += `&orgUnitParentId=${fetchLatestOrgUnitLevelId(value)}`;
                } else {
                    url += `&${key}=${value}`;
                }
            }
        });

        return url;
    }

    handleChangeTab(tab, redirect = true) {
        if (redirect) {
            const { redirectTo, params } = this.props;
            const newParams = {
                ...params,
                tab,
            };
            redirectTo(baseUrl, newParams);
        }

        if (!this.state.hasLocations && tab === 'map') {
            this.fetchOrgUnitsLocations();
        }
        this.setState({
            tab,
        });
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
        } = this.props;
        dispatch(this.props.setOrgUnitsListFetching(true));
        const urlLocation = this.getEndpointUrl(false, '', true);
        fetchOrgUnitsList(dispatch, urlLocation).then((orgUnits) => {
            this.setState({
                hasLocations: true,
            });
            this.props.setOrgUnitsLocations(mapOrgUnitByLocation(orgUnits));
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
        if (withLocations) {
            const urlLocation = this.getEndpointUrl(false, '', true);
            promises.push(fetchOrgUnitsList(dispatch, urlLocation));
        }
        Promise.all(promises).then((data) => {
            if (!params.searchActive) {
                const newParams = {
                    ...params,
                };
                newParams.searchActive = true;
                this.props.redirectTo(baseUrl, newParams);
            }
            this.props.setOrgUnits(data[0].orgunits, params, data[0].count, data[0].pages);
            if (withLocations) {
                this.props.setOrgUnitsLocations(mapOrgUnitByLocation(data[1]));
                this.setState({
                    hasLocations: true,
                });
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
        } = this.props;
        const {
            tableColumns,
            tab,
        } = this.state;
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
                    <Tabs
                        value={tab}
                        classes={{
                            root: classes.tabs,
                            indicator: classes.indicator,
                        }}
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
                </TopBar>
                <Paper className={classes.paperContainer}>
                    <OrgUnitsFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.fetchOrgUnits(params.tab === 'map')}
                        orgUnitTypes={orgUnitTypes}
                        sources={sources}
                        currentTab={tab}
                    />
                    {
                        params.searchActive
                        && (
                            <Fragment>
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
                                            <OrgunitsMap />
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
                </Paper>
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
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
    fetchingList: state.orgUnits.fetchingList,
    fetchingOrgUnitTypes: state.orgUnits.fetchingOrgUnitTypes,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages) => dispatch(setOrgUnits(orgUnitsList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSources: sources => dispatch(setSources(sources)),
    setOrgUnitsListFetching: isFetching => dispatch(setOrgUnitsListFetching(isFetching)),
    setFetchingOrgUnitTypes: isFetching => dispatch(setFetchingOrgUnitTypes(isFetching)),
    setOrgUnitsLocations: orgUnitsList => dispatch(setOrgUnitsLocations(orgUnitsList)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
