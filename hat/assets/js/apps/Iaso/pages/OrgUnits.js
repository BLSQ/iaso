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

const baseUrl = 'orgunits';

const styles = theme => ({
    ...commonStyles(theme),
    paperContainer: {
        ...commonStyles(theme).paperContainer,
        marginTop: 0,
        paddingBottom: 0,
    },
    reactTable: {
        ...reactTable(theme).reactTable,
        marginTop: theme.spacing(4),
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

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: orgUnitsTableColumns(props.intl.formatMessage, this),
            tab: props.params.tab ? props.params.tab : 'list',
        };
    }

    componentWillMount() {
        if (this.props.params.searchActive) {
            this.fetchOrgUnits();
        }
        fetchOrgUnitsTypes(this.props.dispatch).then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));

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
        if (!this.props.params.searchActive && this.props.reduxPage.list) {
            this.resetOrgUnitData();
        }
        const {
            params,
        } = this.props;
        // if (params.pageSize !== prevProps.params.pageSize
        //     || params.order !== prevProps.params.order
        //     || params.page !== prevProps.params.page) {
        //     this.fetchOrgUnits();
        // }
    }

    componentWillUnmount() {
        this.props.setOrgUnits(null, this.props.params, 0, 1);
    }

    getEndpointUrl(toExport, exportType = 'csv', asLocation = false) {
        let url = '/api/orgunits/?';
        const {
            params,
        } = this.props;

        const urlParams = { ...params };

        if (toExport) {
            urlParams[exportType] = true;
        }
        if (asLocation) {
            urlParams.asLocation = true;
            delete urlParams.limit;
            delete urlParams.page;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                if (key === 'levels') {
                    url += `&orgUnitParentId=${fetchLatestOrgUnitLevelId(value)}&validated=both`;
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
        this.setState({
            tab,
        });
    }

    resetOrgUnitData() {
        this.props.setOrgUnits(null, this.props.params, 0, 1);
    }

    selectOrgUnit(orgUnit, tab) {
        const { redirectTo } = this.props;
        const newParams = {
            orgUnitId: orgUnit.id,
            tab,
        };
        redirectTo('orgunits/detail', newParams);
    }

    fetchOrgUnits() {
        const {
            params,
            dispatch,
        } = this.props;

        const url = this.getEndpointUrl();
        const urlLocation = this.getEndpointUrl(false, '', true);

        dispatch(this.props.setOrgUnitsListFetching(true));
        Promise.all([
            fetchOrgUnitsList(dispatch, url).then((data) => {
                console.log('fetchOrgUnitsList', data);
                this.props.setOrgUnits(data.orgUnits, params, data.count, data.pages);
            }),
            // fetchOrgUnitsList(dispatch, urlLocation)
            //     .then(data => this.props.setOrgUnitsLocations(data)),
        ]).then(() => {
            const newParams = {
                ...params,
            };
            newParams.searchActive = true;
            this.props.redirectTo(baseUrl, newParams);
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
                        onSearch={() => this.fetchOrgUnits()}
                        orgUnitTypes={orgUnitTypes}
                        sources={sources}
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
                                    tab === 'map' && (
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
    fetchingList: PropTypes.bool.isRequired,
    setOrgUnitsLocations: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
    fetchingList: state.orgUnits.fetchingList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages) => dispatch(setOrgUnits(orgUnitsList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSources: sources => dispatch(setSources(sources)),
    setOrgUnitsListFetching: isFetching => dispatch(setOrgUnitsListFetching(isFetching)),
    setOrgUnitsLocations: orgUnitsList => dispatch(setOrgUnitsLocations(orgUnitsList)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
