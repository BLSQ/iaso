import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Grid from '@material-ui/core/Grid';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper';

import PropTypes from 'prop-types';

import { setInstances, setInstancesLocations } from '../redux/instancesReducer';
import { setCurrentForm } from '../redux/formsReducer';

import {
    fetchInstancesAsDict,
    fetchInstancesAsLocations,
    fetchFormDetail,
} from '../utils/requests';

import { createUrl } from '../../../utils/fetchData';
import getInstancesColumns from '../utils/instancesUtils';

import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import DownloadButtonsComponent from '../components/buttons/DownloadButtonsComponent';
import InstancesMap from '../components/maps/InstancesMapComponent';
import BackButton from '../components/buttons/BackButtonComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';

import commonStyles from '../styles/common';


const baseUrl = 'instances';

const styles = theme => ({
    ...commonStyles(theme),
    paperContainer: {
        ...commonStyles(theme).paperContainer,
        marginTop: 0,
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
            limit: params.pageSize ? params.pageSize : 50,
            order: params.order ? params.order : '-updated_at',
            page: params.page ? params.page : 1,
            form_id: params.formId,
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
        const { redirectTo, params } = this.props;
        this.props.setCurrentForm(undefined);
        this.props.setInstances([], params, 0, 0);
        redirectTo('forms', {
            date_from: params.date_from,
            date_to: params.date_to,
            order: params.formOrder,
            pageSize: params.formPageSize,
            page: params.formPage,
        });
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
        fetchInstancesAsDict(dispatch, url).then((data) => {
            const instances = {
                ...data.instances,
            };
            this.props.setInstances(data.instances, params, data.count, data.pages);
            this.setState({
                tableColumns: getInstancesColumns(formatMessage, instances, this),
            });
        });

        const urlLocation = this.getEndpointUrl(false, '', true);
        fetchInstancesAsLocations(dispatch, urlLocation).then(data => this.props.setInstancesLocations(data));
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
        } = this.props;
        const {
            tab,
        } = this.state;
        return (
            <section className="instances">
                <TopBar
                    title={`${formatMessage({
                        defaultMessage: 'Record(s) for the form',
                        id: 'iaso.instance.form',
                    })}: ${currentForm ? currentForm.name : ''}`}
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
                                id: 'iaso.instande.list',
                            })}
                        />
                        <Tab
                            value="map"
                            label={formatMessage({
                                defaultMessage: 'Map',
                                id: 'iaso.instande.map',
                            })}
                        />
                    </Tabs>
                </TopBar>
                {
                    fetching
                    && <LoadingSpinner />
                }
                {!fetching
                    && (
                        <Paper className={classes.paperContainer}>
                            {
                                tab === 'list' && (
                                    <CustomTableComponent
                                        isSortable
                                        pageSize={50}
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
                                )
                            }
                            {
                                tab === 'map' && (
                                    <InstancesMap instances={instancesLocations} />
                                )
                            }
                            <Grid container spacing={0} alignItems="center" className={classes.marginTop}>

                                <Grid xs={6} container justify="flex-start">
                                    <BackButton goBack={() => this.goBack()} />
                                </Grid>

                                <Grid xs={6} container justify="flex-end">
                                    {tab === 'list'
                                        && (
                                            <DownloadButtonsComponent
                                                csvUrl={this.getEndpointUrl(true, 'csv')}
                                                xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                            />
                                        )}
                                </Grid>
                            </Grid>
                        </Paper>
                    )
                }
            </section>
        );
    }
}
Instances.defaultProps = {
    reduxPage: undefined,
    currentForm: undefined,
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
};

const MapStateToProps = state => ({
    reduxPage: state.instances.instancesPage,
    instancesLocations: state.instances.instancesLocations,
    fetching: state.instances.fetching,
    currentForm: state.forms.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentForm: form => dispatch(setCurrentForm(form)),
    setInstances: (instances, params, count, pages) => dispatch(setInstances(instances, true, params, count, pages)),
    setInstancesLocations: instances => dispatch(setInstancesLocations(instances)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Instances)),
);
