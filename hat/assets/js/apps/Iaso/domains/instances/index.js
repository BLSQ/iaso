import React, { useState, useEffect } from 'react';
import { makeStyles, Grid, Box } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';

import PropTypes from 'prop-types';

import {
    getTableUrl,
    commonStyles,
    LoadingSpinner,
    AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import {
    resetInstances,
    setInstances,
    setInstancesSmallDict,
    setInstancesFetching,
    createInstance,
} from './actions';
import { redirectToReplace } from '../../routing/actions';
import { fetchFormDetailsForInstance, fetchPossibleFields } from './requests';
import {
    fetchInstancesAsDict,
    fetchInstancesAsSmallDict,
} from '../../utils/requests';

import { getInstancesFilesList, getSelectionActions } from './utils';
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

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
}));

const Instances = ({ router, params }) => {
    const classes = useStyles();
    const reduxPage = useSelector(state => state.instances.instancesPage);
    const instancesSmall = useSelector(state => state.instances.instancesSmall);
    const fetching = useSelector(state => state.instances.fetching);
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [tableColumns, setTableColumns] = useState([]);
    const [tab, setTab] = useState(params.tab ?? 'list');
    const [forceRefresh, setForceRefresh] = useState(false);
    const [labelKeys, setLabelKeys] = useState([]);
    const [formName, setFormName] = useState('');
    const [possibleFields, setPossibleFields] = useState(null);
    const [periodType, setPeriodType] = useState(null);

    const getFilters = () => {
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
    };
    const getEndpointUrl = (
        toExport,
        exportType = 'csv',
        asSmallDict = false,
    ) => {
        const urlParams = {
            limit: params.pageSize ? params.pageSize : 20,
            order: params.order ? params.order : `-${defaultOrder}`,
            page: params.page ? params.page : 1,
            asSmallDict: true,
            ...getFilters(),
        };
        return getTableUrl(
            'instances',
            urlParams,
            toExport,
            exportType,
            false,
            asSmallDict,
        );
    };

    const fetchSmallInstances = () => {
        const urlSmall = getEndpointUrl(false, '', true);
        dispatch(setInstancesFetching(true));
        return fetchInstancesAsSmallDict(dispatch, urlSmall).then(
            smallInstancesData => {
                dispatch(setInstancesSmallDict(smallInstancesData));
                dispatch(setInstancesFetching(false));
            },
        );
    };

    const fetchInstances = (changeLoad = true) => {
        const url = getEndpointUrl();
        if (changeLoad) {
            dispatch(setInstancesFetching(true));
        }
        return fetchInstancesAsDict(dispatch, url).then(instancesData => {
            if (changeLoad) {
                dispatch(setInstancesFetching(false));
            }
            dispatch(
                setInstances(
                    instancesData.instances,
                    params,
                    instancesData.count,
                    instancesData.pages,
                ),
            );
            return {
                list: instancesData.instances,
                count: instancesData.count,
                pages: instancesData.pages,
            };
        });
    };

    const handleChangeTab = (newTab, redirect = true) => {
        if (redirect) {
            const newParams = {
                ...params,
                newTab,
            };
            dispatch(redirectToReplace(baseUrl, newParams));
        }
        setTab(newTab);
    };

    const onSearch = () => {
        fetchInstances();
        if (params.tab === 'map') {
            fetchSmallInstances();
        } else {
            dispatch(setInstancesSmallDict(null));
        }
    };

    useEffect(() => {
        fetchInstances();
    }, [params.pageSize, params.formId, params.order, params.page]);

    useEffect(() => {
        handleChangeTab(params.tab, false);
        if (params.tab !== 'list' && !instancesSmall) {
            fetchSmallInstances();
        }
    }, [params.tab]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(async () => {
        dispatch(resetInstances);
        fetchInstances(tab !== 'map');
        if (tab === 'map') {
            fetchSmallInstances();
        }
        const formDetails = await fetchFormDetailsForInstance(params.formId);
        const newPossibleFields = await fetchPossibleFields(params.formId);
        setLabelKeys(formDetails.label_keys ?? []);
        setFormName(formDetails.name);
        setPeriodType(formDetails.period_type);
        setPossibleFields(newPossibleFields);
    }, []);

    return (
        <section className={classes.relativeContainer}>
            <TopBar
                formName={formName}
                router={router}
                tab={tab}
                handleChangeTab={newTab => handleChangeTab(newTab)}
                params={params}
                periodType={periodType}
                setTableColumns={newCols => setTableColumns(newCols)}
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
                    onSearch={() => onSearch()}
                />
                {tab === 'list' && (
                    <Grid
                        container
                        spacing={0}
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <Grid xs={12} item className={classes.textAlignRight}>
                            <div className={classes.paddingBottomBig}>
                                <CreateReAssignDialogComponent
                                    titleMessage={
                                        MESSAGES.instanceCreationDialogTitle
                                    }
                                    confirmMessage={
                                        MESSAGES.instanceCreateAction
                                    }
                                    formType={{
                                        periodType,
                                        id: params.formId,
                                    }}
                                    onCreateOrReAssign={(
                                        currentForm,
                                        payload,
                                    ) =>
                                        dispatch(
                                            createInstance(
                                                currentForm,
                                                payload,
                                            ),
                                        )
                                    }
                                    renderTrigger={({ openDialog }) => (
                                        <AddButtonComponent
                                            onClick={openDialog}
                                        />
                                    )}
                                />
                                <DownloadButtonsComponent
                                    csvUrl={getEndpointUrl(true, 'csv')}
                                    xlsxUrl={getEndpointUrl(true, 'xlsx')}
                                />
                            </div>
                        </Grid>
                    </Grid>
                )}
                {tab === 'list' && tableColumns.length > 0 && (
                    <SingleTable
                        forceRefresh={forceRefresh}
                        onForceRefreshDone={() => setForceRefresh(false)}
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
                            fetchInstances().then(
                                instancesPages => instancesPages,
                            )
                        }
                        hideGpkg
                        exportButtons={false}
                        isFullHeight={false}
                        multiSelect
                        selectionActions={getSelectionActions(
                            formatMessage,
                            getFilters(),
                            () => setForceRefresh(true),
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
};

Instances.propTypes = {
    params: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
};

export default Instances;
