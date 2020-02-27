import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { replace, push } from 'react-router-redux';

import {
    withStyles, Tabs, Grid, Tab, Box,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import { setInstances, setInstancesSmallDict, setInstancesFetching } from '../redux/instancesReducer';
import { setCurrentForm } from '../redux/formsReducer';
import { setOrgUnitTypes } from '../redux/orgUnitsReducer';
import { setDevicesList, setDevicesOwnershipList } from '../redux/devicesReducer';
import { setPeriods } from '../redux/periodsReducer';

import {
    fetchInstancesAsDict,
    fetchInstancesAsSmallDict,
    fetchFormDetail,
    fetchOrgUnitsTypes,
    fetchDevices,
    fetchDevicesOwnerships,
    fetchPeriods,
} from '../utils/requests';

import { createUrl } from '../../../utils/fetchData';
import { getInstancesColumns, getInstancesFilesList } from '../utils/instancesUtils';
import { fetchLatestOrgUnitLevelId } from '../utils/orgUnitUtils';

import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import DownloadButtonsComponent from '../components/buttons/DownloadButtonsComponent';
import InstancesMap from '../components/maps/InstancesMapComponent';
import InstancesFilesList from '../components/files/InstancesFilesListComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import InstancesFiltersComponent from '../components/filters/InstancesFiltersComponent';

import commonStyles from '../styles/common';

import getTableUrl from '../utils/tableUtils';


const baseUrl = 'instances';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
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
        const {
            dispatch,
            params: {
                formId,
            },
        } = this.props;
        fetchOrgUnitsTypes(dispatch)
            .then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));
        fetchDevices(dispatch)
            .then(devices => this.props.setDevicesList(devices));
        fetchDevicesOwnerships(dispatch)
            .then(devicesOwnershipsList => this.props.setDevicesOwnershipList(devicesOwnershipsList));
        fetchPeriods(dispatch, formId)
            .then(periods => this.props.setPeriods(periods));
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

    getEndpointUrl(toExport, exportType = 'csv', asSmallDict = false) {
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
            periods: params.periods,
            status: params.status,
            deviceOwnershipId: params.deviceOwnershipId,
            orgUnitParentId: fetchLatestOrgUnitLevelId(params.levels),
        };
        return getTableUrl('instances', urlParams, toExport, exportType, false, asSmallDict);
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
        const urlSmall = this.getEndpointUrl(false, '', true);

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
            fetchInstancesAsSmallDict(dispatch, urlSmall)
                .then(data => this.props.setInstancesSmallDict(data)),
        ]).then(() => {
            dispatch(this.props.setInstancesFetching(false));
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            instancesSmall,
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
                        <Tab
                            value="files"
                            label={formatMessage({
                                defaultMessage: 'Files',
                                id: 'iaso.label.files',
                            })}
                        />
                    </Tabs>
                </TopBar>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <Box className={classes.containerFullHeightPadded}>
                    <InstancesFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.fetchInstances()}
                    />
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
                                <InstancesMap instances={instancesSmall} />
                            </div>
                        )
                    }
                    {
                        tab === 'files' && (
                            <InstancesFilesList
                                files={getInstancesFilesList(instancesSmall)}
                            />
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
                </Box>
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
    instancesSmall: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    setInstances: PropTypes.func.isRequired,
    setInstancesSmallDict: PropTypes.func.isRequired,
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
    setPeriods: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.instances.instancesPage,
    instancesSmall: state.instances.instancesSmall,
    fetching: state.instances.fetching,
    currentForm: state.forms.current,
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentForm: form => dispatch(setCurrentForm(form)),
    setInstances: (instances, params, count, pages) => dispatch(setInstances(instances, true, params, count, pages)),
    setInstancesSmallDict: instances => dispatch(setInstancesSmallDict(instances)),
    setInstancesFetching: isFetching => dispatch(setInstancesFetching(isFetching)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    redirectTo: (key, params) => dispatch(replace(`${key}${createUrl(params, '')}`)),
    redirectToPush: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setDevicesList: devices => dispatch(setDevicesList(devices)),
    setDevicesOwnershipList: devicesOwnershipsList => dispatch(setDevicesOwnershipList(devicesOwnershipsList)),
    setPeriods: periods => dispatch(setPeriods(periods)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Instances)),
);
