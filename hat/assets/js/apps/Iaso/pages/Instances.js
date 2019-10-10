import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { replace, push } from 'react-router-redux';

import {
    withStyles, Divider, Tabs, Grid, Tab, Paper,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import { setInstances, setInstancesLocations, setInstancesFetching } from '../redux/instancesReducer';
import { setCurrentForm } from '../redux/formsReducer';
import { setOrgUnitTypes } from '../redux/orgUnitsReducer';
import { setDevicesList, setDevicesOwnershipList } from '../redux/devicesReducer';

import {
    fetchInstancesAsDict,
    fetchInstancesAsLocations,
    fetchFormDetail,
    fetchOrgUnitsTypes,
    fetchDevices,
    fetchDevicesOwnerships,
} from '../utils/requests';

import { createUrl } from '../../../utils/fetchData';
import getInstancesColumns from '../utils/instancesUtils';
import { fetchLatestOrgUnitLevelId } from '../utils/orgUnitUtils';

import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import DownloadButtonsComponent from '../components/buttons/DownloadButtonsComponent';
import InstancesMap from '../components/maps/InstancesMapComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import InstancesFiltersComponent from '../components/filters/InstancesFiltersComponent';

import commonStyles from '../styles/common';
import reactTable from '../styles/reactTable';


const baseUrl = 'instances';

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
});


class Instances extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: [],
            tab: props.params.tab ? props.params.tab : 'list',
        };
    }

    componentWillMount() {
        fetchOrgUnitsTypes(this.props.dispatch)
            .then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));
        fetchDevices(this.props.dispatch)
            .then(devices => this.props.setDevicesList(devices));
        fetchDevicesOwnerships(this.props.dispatch)
            .then(devicesOwnershipsList => this.props.setDevicesOwnershipList(devicesOwnershipsList));
    }


    componentDidMount() {
        const {
            params: {
                formId,
            },
            dispatch,
            currentForm,
        } = this.props;
        if (formId && !currentForm) {
            fetchFormDetail(dispatch, formId).then((form) => {
                this.props.setCurrentForm(form);
            });
        }
        this.fetchInstances();
    }

    componentDidUpdate(prevProps) {
        const {
            params,
        } = this.props;
        if (params.pageSize !== prevProps.params.pageSize
            || params.formId !== prevProps.params.formId
            || params.order !== prevProps.params.order
            || params.page !== prevProps.params.page) {
            this.fetchInstances();
        }
        if (params.tab !== prevProps.params.tab) {
            this.handleChangeTab(params.tab, false);
        }
    }

    getEndpointUrl(toExport, exportType = 'csv', asLocation = false) {
        let url = '/api/instances/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            limit: params.pageSize ? params.pageSize : 20,
            order: params.order ? params.order : '-updated_at',
            page: params.page ? params.page : 1,
            form_id: params.formId,
            withLocation: params.withLocation,
            orgUnitTypeId: params.orgUnitTypeId,
            deviceId: params.deviceId,
            deviceOwnershipId: params.deviceOwnershipId,
            orgUnitParentId: fetchLatestOrgUnitLevelId(params.levels),
        };
        if (toExport) {
            urlParams[exportType] = true;
        }
        if (asLocation) {
            urlParams.as_location = true;
            delete urlParams.limit;
            delete urlParams.page;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
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
            redirectTo('instances', newParams);
        }
        this.setState({
            tab,
        });
    }


    goBack() {
        const { params, router } = this.props;
        this.props.setCurrentForm(undefined);
        this.props.setInstances([], params, 0, 0);
        router.goBack();
    }

    fetchInstances() {
        const {
            params,
            intl: {
                formatMessage,
            },
            dispatch,
        } = this.props;

        const url = this.getEndpointUrl();
        const urlLocation = this.getEndpointUrl(false, '', true);

        dispatch(this.props.setInstancesFetching(true));
        Promise.all([
            fetchInstancesAsDict(dispatch, url).then((data) => {
                const instances = {
                    ...data.instances,
                };
                this.props.setInstances(data.instances, params, data.count, data.pages);
                this.setState({
                    tableColumns: getInstancesColumns(formatMessage, instances),
                });
            }),
            fetchInstancesAsLocations(dispatch, urlLocation)
                .then(data => this.props.setInstancesLocations(data)),
        ]).then(() => {
            dispatch(this.props.setInstancesFetching(false));
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            instancesLocations,
            fetching,
            currentForm,
            intl: {
                formatMessage,
            },
            router,
            prevPathname,
            redirectToPush,
        } = this.props;
        const {
            tab,
        } = this.state;
        return (
            <section className={classes.relativeContainer}>
                <TopBar
                    title={`${formatMessage({
                        defaultMessage: 'Record(s) for the form',
                        id: 'iaso.instance.form',
                    })}: ${currentForm ? currentForm.name : ''}`}
                    displayBackButton
                    goBack={() => {
                        if (prevPathname) {
                            router.goBack();
                        } else {
                            redirectToPush('forms', {});
                        }
                    }}
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
                                id: 'iaso.instance.list',
                            })}
                        />
                        <Tab
                            value="map"
                            label={formatMessage({
                                defaultMessage: 'Map',
                                id: 'iaso.instance.map',
                            })}
                        />
                    </Tabs>
                </TopBar>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <Paper className={classes.paperContainer}>
                    <InstancesFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.fetchInstances()}
                    />

                    <Divider className={classes.dividerMarginNeg} />
                    {
                        tab === 'list' && (
                            <div className={classes.reactTable}>
                                <CustomTableComponent
                                    isSortable
                                    pageSize={20}
                                    showPagination
                                    columns={this.state.tableColumns}
                                    defaultSorted={[{ id: 'updated_at', desc: false }]}
                                    params={params}
                                    defaultPath={baseUrl}
                                    dataKey="instances"
                                    multiSort={false}
                                    fetchDatas={false}
                                    canSelect={false}
                                    reduxPage={reduxPage}
                                />
                            </div>
                        )
                    }
                    {
                        tab === 'map' && (
                            <div className={classes.containerMarginNeg}>
                                <InstancesMap instances={instancesLocations} />
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
                </Paper>
            </section>
        );
    }
}
Instances.defaultProps = {
    reduxPage: undefined,
    currentForm: undefined,
    prevPathname: null,
};

Instances.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    instancesLocations: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    setInstances: PropTypes.func.isRequired,
    setInstancesLocations: PropTypes.func.isRequired,
    setCurrentForm: PropTypes.func.isRequired,
    currentForm: PropTypes.object,
    redirectTo: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    setInstancesFetching: PropTypes.func.isRequired,
    setDevicesList: PropTypes.func.isRequired,
    setDevicesOwnershipList: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired,
    redirectToPush: PropTypes.func.isRequired,
    prevPathname: PropTypes.any,
};

const MapStateToProps = state => ({
    reduxPage: state.instances.instancesPage,
    instancesLocations: state.instances.instancesLocations,
    fetching: state.instances.fetching,
    currentForm: state.forms.current,
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentForm: form => dispatch(setCurrentForm(form)),
    setInstances: (instances, params, count, pages) => dispatch(setInstances(instances, true, params, count, pages)),
    setInstancesLocations: instances => dispatch(setInstancesLocations(instances)),
    setInstancesFetching: isFetching => dispatch(setInstancesFetching(isFetching)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    redirectTo: (key, params) => dispatch(replace(`${key}${createUrl(params, '')}`)),
    redirectToPush: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setDevicesList: devices => dispatch(setDevicesList(devices)),
    setDevicesOwnershipList: devicesOwnershipsList => dispatch(setDevicesOwnershipList(devicesOwnershipsList)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Instances)),
);
