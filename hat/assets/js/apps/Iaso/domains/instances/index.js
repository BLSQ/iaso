import React, { useCallback, useState } from 'react';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import PropTypes from 'prop-types';

import {
    AddButton as AddButtonComponent,
    commonStyles,
    LoadingSpinner,
    selectionInitialState,
    setTableSelection,
    useSafeIntl,
} from 'bluesquare-components';

import { useQueryClient } from 'react-query';
import { createInstance } from './actions';
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
    getSelectionActions,
    getExportUrl,
} from './utils';

import { InstancesTopBar as TopBar } from './components/InstancesTopBar';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import InstancesMap from './components/InstancesMapComponent';
import InstancesFiltersComponent from './components/InstancesFiltersComponent';
import CreateReAssignDialogComponent from './components/CreateReAssignDialogComponent';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';
import { useSnackQuery } from '../../libs/apiHooks.ts';
import snackMessages from '../../components/snackBars/messages';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { PaginatedInstanceFiles } from './components/PaginatedInstancesFiles';
import { convertObjectToString } from '../../utils';

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

    const [selection, setSelection] = useState(selectionInitialState);
    const [tableColumns, setTableColumns] = useState([]);
    const [tab, setTab] = useState(params.tab ?? 'list');

    const [resetPageToOne, setResetPageToOne] = useState(
        convertObjectToString(params),
    );

    // Data for the map
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
            enabled: params.tab === 'map',
            select: result => result.instances,
        },
    );

    const {
        data,
        isLoading: loadingList,
        isFetching: fetchingList,
    } = useSnackQuery(
        ['instances', params],
        () => fetchInstancesAsDict(getEndpointUrl(params)),
        snackMessages.fetchInstanceDictError,
        { keepPreviousData: true },
    );
    // Move to delete when we port dialog to react-query
    const refetchInstances = () => queryClient.invalidateQueries(['instances']);

    const formIds = params.formIds?.split(',');
    const formId = formIds?.length === 1 ? formIds[0] : undefined;

    const { data: formDetails, fetching: fetchingDetail } = useSnackQuery(
        ['formDetailsForInstance', `${formId}`],
        () => fetchFormDetailsForInstance(formId),
        undefined,
        { enabled: Boolean(formId) },
    );
    const labelKeys = formDetails?.label_keys ?? [];
    const formName = formDetails?.name ?? '';
    const periodType = formDetails?.period_type;
    const orgUnitTypes = formDetails?.org_unit_type_ids ?? [];

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

    const onSearch = useCallback(
        newParams => {
            setSelection(selectionInitialState);
            setResetPageToOne(convertObjectToString(newParams));
            dispatch(redirectToReplace(baseUrl, newParams));
        },
        [dispatch],
    );

    getEndpointUrl(params, 'csv');
    const fetching = loadingMap || loadingList || fetchingDetail;
    return (
        <section className={classes.relativeContainer}>
            <TopBar
                formName={formName}
                tab={tab}
                handleChangeTab={newTab => handleChangeTab(newTab)}
                params={params}
                periodType={periodType}
                setTableColumns={newCols => setTableColumns(newCols)}
                baseUrl={baseUrl}
                labelKeys={labelKeys}
                possibleFields={possibleFields}
                formDetails={formDetails}
            />

            {fetching && <LoadingSpinner />}
            <Box className={classes.containerFullHeightPadded}>
                <InstancesFiltersComponent
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
                                        orgUnitTypes={orgUnitTypes}
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
                                    <Box
                                        mb={2}
                                        mt={2}
                                        display="flex"
                                        justifyContent="flex-end"
                                    >
                                        <DownloadButtonsComponent
                                            csvUrl={getExportUrl(params, 'csv')}
                                            xlsxUrl={getExportUrl(
                                                params,
                                                'xlsx',
                                            )}
                                        />
                                    </Box>
                                </div>
                            )}
                        </Grid>
                    </Grid>
                )}
                {tab === 'list' && tableColumns.length > 0 && (
                    <TableWithDeepLink
                        data={data?.instances ?? []}
                        pages={data?.pages}
                        count={data?.count}
                        params={params}
                        columns={tableColumns}
                        baseUrl={baseUrl}
                        multiSelect
                        defaultSorted={[{ id: 'updated_at', desc: true }]}
                        selectionActions={getSelectionActions(
                            formatMessage,
                            getFilters(params),
                            () => refetchInstances(),
                            params.showDeleted === 'true',
                            classes,
                        )}
                        selection={selection}
                        setTableSelection={(
                            selectionType,
                            items,
                            totalCount,
                        ) => {
                            setSelection(
                                setTableSelection(
                                    selection,
                                    selectionType,
                                    items,
                                    totalCount,
                                ),
                            );
                        }}
                        extraProps={{
                            loading: fetchingList,
                        }}
                        resetPageToOne={resetPageToOne}
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
                    <PaginatedInstanceFiles
                        params={params}
                        updateParams={onSearch}
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
