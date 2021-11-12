import React, { useState, useCallback } from 'react';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';

import PropTypes from 'prop-types';

import {
    AddButton as AddButtonComponent,
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';

import { useQueryClient } from 'react-query';
import { createInstance, setInstances } from './actions';
import { redirectToReplace } from '../../routing/actions';
import {
    fetchFormDetailsForInstance,
    fetchInstancesAsDict,
    fetchInstancesAsSmallDict,
    fetchPossibleFields,
} from './requests';

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
import { useSnackQuery } from '../../libs/apiHooks';
import snackMessages from '../../components/snackBars/messages';

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
    const queryClient = useQueryClient();

    const reduxPage = useSelector(state => state.instances.instancesPage);

    const [tableColumns, setTableColumns] = useState([]);
    const [tab, setTab] = useState(params.tab ?? 'list');

    // Data for the map and files, only load in theses tabs
    const { data: instancesSmall, isLoading: loadingMap } = useSnackQuery(
        ['instances', 'small', params],
        // Ugly fix to limit results displayed on map, IA-904
        () =>
            fetchInstancesAsSmallDict(
                `${getEndpointUrl(params, false, '', true)}&limit=${
                    params.mapResults || 3000
                }`,
            ),
        snackMessages.fetchInstanceLocationError,

        {
            enabled: params.tab === 'files' || params.tab === 'maps',
            select: result => result.instances,
        },
    );

    const { isLoading: loadingList } = useSnackQuery(
        ['instances', params],
        () => fetchInstancesAsDict(getEndpointUrl(params)),
        snackMessages.fetchInstanceDictError,
        {
            // Temporary  solution till we port the table out of redux
            onSuccess: instancesData =>
                dispatch(
                    setInstances(
                        instancesData.instances,
                        true,
                        params,
                        instancesData.count,
                        instancesData.pages,
                    ),
                ),
        },
    );
    // Move to delete when we port dialog to react-query
    const refetchInstances = () => queryClient.invalidateQueries(['instances']);

    const formIds = params.formIds?.split(',');
    const formId = formIds?.length === 1 ? formIds[0] : undefined;

    const { data: formDetails } = useSnackQuery(
        ['formDetailsForInstance', formId],
        () => fetchFormDetailsForInstance(formId),
        undefined,
        { enabled: Boolean(formId) },
    );
    const labelKeys = formDetails?.label_keys ?? [];
    const formName = formDetails?.name ?? '';
    const periodType = formDetails?.period_type;

    const { data: possibleFields } = useSnackQuery(
        ['possibleFieldForForm', formId],
        () => fetchPossibleFields(formId),
        undefined,
        {
            enabled: Boolean(formId),
            select: response => response.possible_fields,
        },
    );

    const handleChangeTab = useCallback(
        newTab => {
            const newParams = {
                ...params,
                tab: newTab,
            };
            setTab(newTab);
            dispatch(redirectToReplace(baseUrl, newParams));
        },
        [params, dispatch],
    );

    const onSearch = newParams => {
        dispatch(redirectToReplace(baseUrl, newParams));
    };

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
                            {formIds?.length === 1 && (
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
                            () => refetchInstances(),
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
                        fetching={loadingMap}
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
