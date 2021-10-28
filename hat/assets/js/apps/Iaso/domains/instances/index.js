import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withStyles, Grid, Box } from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    getTableUrl,
    commonStyles,
    injectIntl,
    LoadingSpinner,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import {
    resetInstances,
    setInstances,
    setInstancesSmallDict,
    setInstancesFetching,
    createInstance,
} from './actions';
import {
    redirectTo as redirectToAction,
    redirectToReplace as redirectToReplaceAction,
} from '../../routing/actions';
import { fetchFormDetailsForInstance, fetchPossibleFields } from './requests';
import {
    fetchInstancesAsDict,
    fetchInstancesAsSmallDict,
} from '../../utils/requests';

import {
    getInstancesFilesList,
    getMetasColumns,
    getSelectionActions,
} from './utils';
import { fetchLatestOrgUnitLevelId } from '../orgUnits/utils';
import { getFromDateString, getToDateString } from '../../utils/dates';

import { TopBar } from './components/TopBar';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import InstancesMap from './components/InstancesMapComponent';
import InstancesFilesList from './components/InstancesFilesListComponent';
import InstancesFiltersComponent from './components/InstancesFiltersComponent';
import CreateReAssignDialogComponent from './components/CreateReAssignDialogComponent';
import SingleTable from '../../components/tables/SingleTable';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';

const baseUrl = baseUrls.instances;

const defaultOrder = 'updated_at';

const asBackendStatus = status => {
    if (status) {
        return status
            .split(',')
            .map(s => (s === 'ERROR' ? 'DUPLICATED' : s))
            .join(',');
    }
    return status;
};

const styles = theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
    iconDisabled: {
        opacity: 0.3,
        cursor: 'not-allowed',
    },
});

class Instances extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: [],
            tab: props.params.tab ?? 'list',
            forceRefresh: false,
            labelKeys: [],
            formName: '',
            formId: '',
            possibleFields: null,
            periodType: null,
        };
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        const {
            params: { columns },
            params,
            redirectToReplace,
        } = this.props;
        this.props.resetInstances();
        if (!columns) {
            const newParams = {
                ...params,
                columns: getMetasColumns().join(','),
            };
            redirectToReplace(baseUrl, newParams);
        }
    }

    async componentDidMount() {
        const {
            params: { formId, tab },
        } = this.props;

        this.fetchInstances(tab !== 'map');
        if (tab === 'map') {
            this.fetchSmallInstances();
        }
        const formDetails = await fetchFormDetailsForInstance(formId);
        const possibleFields = await fetchPossibleFields(formId);
        this.setState(state => {
            return {
                ...state,
                ...{
                    labelKeys: formDetails.label_keys ?? [],
                    formName: formDetails.name,
                    formId: formDetails.id,
                    periodType: formDetails.period_type,
                    possibleFields,
                },
            };
        });
    }

    async componentDidUpdate(prevProps) {
        const { params, instancesSmall } = this.props;
        let { possibleFields } = { ...this.state };
        if (!possibleFields) {
            possibleFields = await fetchPossibleFields(
                this.props.params.formId,
            );
        }
        if (
            params.pageSize !== prevProps.params.pageSize ||
            params.formId !== prevProps.params.formId ||
            params.order !== prevProps.params.order ||
            params.page !== prevProps.params.page
        ) {
            this.fetchInstances();
        }

        if (params.tab !== prevProps.params.tab) {
            this.handleChangeTab(params.tab, false);
            if (params.tab !== 'list' && !instancesSmall) {
                this.fetchSmallInstances();
            }
        }
    }

    handleChangeTab(tab, redirect = true) {
        if (redirect) {
            const { redirectToReplace, params } = this.props;
            const newParams = {
                ...params,
                tab,
            };
            redirectToReplace(baseUrl, newParams);
        }
        this.setState(state => {
            return { ...state, tab };
        });
    }

    onSearch() {
        const { params } = this.props;
        this.fetchInstances();
        if (params.tab === 'map') {
            this.fetchSmallInstances();
        } else {
            this.props.setInstancesSmallDict(null);
        }
    }

    getFilters() {
        const { params } = this.props;
        const allFilters = {
            form_id: parseInt(params.formId, 10),
            withLocation: params.withLocation,
            orgUnitTypeId: params.orgUnitTypeId,
            deviceId: params.deviceId,
            periods: params.periods,
            status: asBackendStatus(params.status),
            deviceOwnershipId: params.deviceOwnershipId,
            search: params.search,
            orgUnitParentId: fetchLatestOrgUnitLevelId(params.levels),
            dateFrom: getFromDateString(params.dateFrom),
            dateTo: getToDateString(params.dateTo),
            showDeleted: params.showDeleted,
        };
        const filters = {};
        Object.keys(allFilters).forEach(k => {
            if (allFilters[k]) {
                filters[k] = allFilters[k];
            }
        });
        return filters;
    }

    getEndpointUrl(toExport, exportType = 'csv', asSmallDict = false) {
        const { params } = this.props;
        const urlParams = {
            limit: params.pageSize ? params.pageSize : 20,
            order: params.order ? params.order : `-${defaultOrder}`,
            page: params.page ? params.page : 1,
            asSmallDict: true,
            ...this.getFilters(),
        };
        return getTableUrl(
            'instances',
            urlParams,
            toExport,
            exportType,
            false,
            asSmallDict,
        );
    }

    setForceRefresh(forceRefresh) {
        this.setState(state => {
            return { ...state, forceRefresh };
        });
    }

    fetchSmallInstances() {
        const { dispatch } = this.props;
        const urlSmall = this.getEndpointUrl(false, '', true);
        dispatch(this.props.setInstancesFetching(true));
        return fetchInstancesAsSmallDict(dispatch, urlSmall).then(
            smallInstancesData => {
                this.props.setInstancesSmallDict(smallInstancesData);
                dispatch(this.props.setInstancesFetching(false));
            },
        );
    }

    fetchInstances(changeLoad = true) {
        const { params, dispatch } = this.props;

        const url = this.getEndpointUrl();
        if (changeLoad) {
            dispatch(this.props.setInstancesFetching(true));
        }
        return fetchInstancesAsDict(dispatch, url).then(instancesData => {
            if (changeLoad) {
                dispatch(this.props.setInstancesFetching(false));
            }
            this.props.setInstances(
                instancesData.instances,
                params,
                instancesData.count,
                instancesData.pages,
            );
            return {
                list: instancesData.instances,
                count: instancesData.count,
                pages: instancesData.pages,
            };
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            instancesSmall,
            fetching,
            intl: { formatMessage },
            router,
        } = this.props;
        const {
            tab,
            tableColumns,
            forceRefresh,
            formName,
            periodType,
            labelKeys,
            possibleFields,
        } = this.state;
        return (
            <section className={classes.relativeContainer}>
                <TopBar
                    formName={formName}
                    router={router}
                    tab={tab}
                    handleChangeTab={newTab => this.handleChangeTab(newTab)}
                    params={params}
                    periodType={periodType}
                    setTableColumns={newCols =>
                        this.setState({ tableColumns: newCols })
                    }
                    tableColumns={tableColumns}
                    baseUrl={baseUrl}
                    labelKeys={labelKeys}
                    possibleFields={possibleFields}
                />

                {fetching && <LoadingSpinner />}
                <Box className={classes.containerFullHeightPadded}>
                    <InstancesFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.onSearch()}
                    />
                    {tab === 'list' && (
                        <Grid
                            container
                            spacing={0}
                            alignItems="center"
                            className={classes.marginTop}
                        >
                            <Grid
                                xs={12}
                                item
                                className={classes.textAlignRight}
                            >
                                <div className={classes.paddingBottomBig}>
                                    <CreateReAssignDialogComponent
                                        titleMessage={
                                            MESSAGES.instanceCreationDialogTitle
                                        }
                                        confirmMessage={
                                            MESSAGES.instanceCreateAction
                                        }
                                        formType={{
                                            periodType: this.state.periodType,
                                            id: this.state.formId,
                                        }}
                                        onCreateOrReAssign={
                                            this.props.createInstance
                                        }
                                        renderTrigger={({ openDialog }) => (
                                            <AddButtonComponent
                                                onClick={openDialog}
                                            />
                                        )}
                                    />
                                    <DownloadButtonsComponent
                                        csvUrl={this.getEndpointUrl(
                                            true,
                                            'csv',
                                        )}
                                        xlsxUrl={this.getEndpointUrl(
                                            true,
                                            'xlsx',
                                        )}
                                    />
                                </div>
                            </Grid>
                        </Grid>
                    )}
                    {tab === 'list' && tableColumns.length > 0 && (
                        <SingleTable
                            forceRefresh={forceRefresh}
                            onForceRefreshDone={() =>
                                this.setForceRefresh(false)
                            }
                            apiParams={{
                                ...params,
                            }}
                            setIsLoading={false}
                            baseUrl={baseUrl}
                            results={reduxPage}
                            endPointPath="instances"
                            dataKey="list"
                            columns={tableColumns}
                            defaultPageSize={20}
                            fetchItems={() =>
                                this.fetchInstances().then(
                                    instancesPages => instancesPages,
                                )
                            }
                            hideGpkg
                            exportButtons={false}
                            isFullHeight={false}
                            multiSelect
                            selectionActions={getSelectionActions(
                                formatMessage,
                                this.getFilters(),
                                () => this.setForceRefresh(true),
                                params.showDeleted === 'true',
                                classes,
                            )}
                        />
                    )}
                    {!fetching && instancesSmall && tab === 'map' && (
                        <div className={classes.containerMarginNeg}>
                            <InstancesMap instances={instancesSmall} />
                        </div>
                    )}
                    {!fetching && instancesSmall && tab === 'files' && (
                        <InstancesFilesList
                            files={getInstancesFilesList(instancesSmall)}
                        />
                    )}
                </Box>
            </section>
        );
    }
}
Instances.defaultProps = {
    reduxPage: undefined,
    instancesSmall: null,
};

Instances.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    instancesSmall: PropTypes.any,
    params: PropTypes.object.isRequired,
    setInstances: PropTypes.func.isRequired,
    setInstancesSmallDict: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
    setInstancesFetching: PropTypes.func.isRequired,
    resetInstances: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired,
    redirectToReplace: PropTypes.func.isRequired,
    createInstance: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.instances.instancesPage,
    instancesSmall: state.instances.instancesSmall,
    fetching: state.instances.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetInstances: () => dispatch(resetInstances()),
    setInstances: (instances, params, count, pages) =>
        dispatch(setInstances(instances, true, params, count, pages)),
    setInstancesSmallDict: instances =>
        dispatch(setInstancesSmallDict(instances)),
    setInstancesFetching: isFetching =>
        dispatch(setInstancesFetching(isFetching)),
    createInstance: (currentForm, payload) =>
        dispatch(createInstance(currentForm, payload)),
    ...bindActionCreators(
        {
            redirectTo: redirectToAction,
            redirectToReplace: redirectToReplaceAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Instances)),
);
