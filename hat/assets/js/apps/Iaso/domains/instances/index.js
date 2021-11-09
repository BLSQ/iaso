import React, { useEffect, useState } from 'react';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';

import PropTypes from 'prop-types';

import {
    AddButton as AddButtonComponent,
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import {
    createInstance,
    resetInstances,
    setInstances,
    setInstancesFetching,
} from './actions';
import { redirectToReplace } from '../../routing/actions';
import { fetchFormDetailsForInstance, fetchPossibleFields } from './requests';
import {
    fetchInstancesAsDict,
    fetchInstancesAsSmallDict,
} from '../../utils/requests';

import {
    getEndpointUrl,
    getFilters,
    getInstancesFilesList,
    getSelectionActions,
} from './utils';

import { InstancesTopBar as TopBar } from './components/InstancesTopBar';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import InstancesMap from './components/InstancesMapComponent';
import InstancesFilesList from './components/InstancesFilesListComponent';
import InstancesFiltersComponent from './components/InstancesFiltersComponent';
import CreateReAssignDialogComponent from './components/CreateReAssignDialogComponent';
import SingleTable from '../../components/tables/SingleTable';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';

const baseUrl = baseUrls.instances;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
}));

const Instances = ({ params }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const reduxPage = useSelector(state => state.instances.instancesPage);
    const loadingList = useSelector(state => state.instances.fetching);

    const [tableColumns, setTableColumns] = useState([]);
    const [tab, setTab] = useState(params.tab ?? 'list');
    const [loadingMap, setLoadingMap] = useState(tab === 'map');
    const [forceRefresh, setForceRefresh] = useState(false);
    const [instancesSmall, setInstancesSmall] = useState(null);
    const [labelKeys, setLabelKeys] = useState([]);
    const [formName, setFormName] = useState('');
    const [possibleFields, setPossibleFields] = useState(null);
    const [periodType, setPeriodType] = useState(null);

    const fetchSmallInstances = (queryParams = params) => {
        const urlSmall = getEndpointUrl(queryParams, false, '', true);
        setLoadingMap(true);
        return fetchInstancesAsSmallDict(dispatch, urlSmall).then(
            smallInstancesData => {
                setInstancesSmall(smallInstancesData || []);
                setLoadingMap(false);
            },
        );
    };

    const fetchInstances = (changeLoad = true, queryParams = params) => {
        const url = getEndpointUrl(queryParams);
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
                    true,
                    queryParams,
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

    const handleChangeTab = newTab => {
        const newParams = {
            ...params,
            tab: newTab,
        };
        if (newTab === 'map' && !instancesSmall) {
            fetchSmallInstances(newParams);
        }
        dispatch(redirectToReplace(baseUrl, newParams));
        setTab(newTab);
    };

    const onSearch = newParams => {
        dispatch(redirectToReplace(baseUrl, newParams));
    };

    useEffect(() => {
        dispatch(resetInstances);
        fetchInstances();
        if (params.tab === 'map') {
            fetchSmallInstances();
        } else {
            setInstancesSmall(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        params.pageSize,
        params.formIds,
        params.order,
        params.page,
        params.withLocation,
        params.showDeleted,
        params.orgUnitTypeId,
        params.periods,
        params.status,
        params.deviceId,
        params.deviceOwnershipId,
        params.search,
        params.levels,
        params.dateFrom,
        params.dateTo,
        params.formIds,
    ]);

    useEffect(() => {
        const onLoad = async () => {
            const formIds = params.formIds?.split(',');
            if (formIds?.length === 1) {
                const formDetails = await fetchFormDetailsForInstance(
                    formIds[0],
                );
                const newPossibleFields = await fetchPossibleFields(formIds[0]);
                setLabelKeys(formDetails.label_keys ?? []);
                setFormName(formDetails.name);
                setPeriodType(formDetails.period_type);
                setPossibleFields(newPossibleFields);
            }
        };
        onLoad();
    }, [params.formIds]);
    const fetching = loadingMap || loadingList;
    return (
        <section className={classes.relativeContainer}>
            <TopBar
                formName={formName}
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
                    onSearch={onSearch}
                />
                {tab === 'list' && (
                    <Grid
                        container
                        spacing={0}
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <Grid xs={12} item className={classes.textAlignRight}>
                            {params.formIds?.split(',').length === 1 && (
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
                                            id: params.formIds,
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
                                        csvUrl={getEndpointUrl(
                                            params,
                                            true,
                                            'csv',
                                        )}
                                        xlsxUrl={getEndpointUrl(
                                            params,
                                            true,
                                            'xlsx',
                                        )}
                                    />
                                </div>
                            )}
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
                        hideGpkg
                        exportButtons={false}
                        isFullHeight={false}
                        multiSelect
                        selectionActions={getSelectionActions(
                            formatMessage,
                            getFilters(params),
                            () => setForceRefresh(true),
                            params.showDeleted === 'true',
                            classes,
                        )}
                    />
                )}
                {tab === 'map' && (
                    <div className={classes.containerMarginNeg}>
                        <InstancesMap
                            instances={instancesSmall || []}
                            fetching={loadingMap}
                        />
                    </div>
                )}
                {tab === 'files' && (
                    <InstancesFilesList
                        files={getInstancesFilesList(instancesSmall || [])}
                    />
                )}
            </Box>
        </section>
    );
};

Instances.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Instances;
