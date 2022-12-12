import React, { useCallback, useState, useMemo } from 'react';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import PropTypes from 'prop-types';

import {
    AddButton as AddButtonComponent,
    commonStyles,
    makeFullModal,
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
import { CreateReAssignDialogComponent } from './components/CreateReAssignDialogComponent';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';
import { useSnackQuery } from '../../libs/apiHooks.ts';
import snackMessages from '../../components/snackBars/messages';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { PaginatedInstanceFiles } from './components/PaginatedInstancesFiles';
import { useGetPossibleFields } from '../forms/hooks/useGetPossibleFields.ts';
import UpdateIcon from '@material-ui/icons/Update';

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

    const formIds = params.formIds?.split(',');
    const formId = formIds?.length === 1 ? formIds[0] : undefined;

    const { possibleFields, isLoading: isLoadingPossibleFields } =
        useGetPossibleFields(formId);
    const fieldsSearchApi = useMemo(() => {
        let newFieldsSearch = params.fieldsSearch;

        possibleFields.forEach(field => {
            if (newFieldsSearch?.includes(field.fieldKey)) {
                newFieldsSearch = newFieldsSearch.replace(
                    field.fieldKey,
                    field.name,
                );
            }
        });
        return possibleFields.length === 0 ? undefined : newFieldsSearch;
    }, [params.fieldsSearch, possibleFields]);
    const apiParams = useMemo(
        () => ({ ...params, fieldsSearch: fieldsSearchApi }),
        [fieldsSearchApi, params],
    );

    // Data for the map
    const { data: instancesSmall, isLoading: loadingMap } = useSnackQuery(
        ['instances', 'small', apiParams],
        // Ugly fix to limit results displayed on map, IA-904
        () =>
            fetchInstancesAsSmallDict(
                `${getEndpointUrl(apiParams, false, '', true)}&limit=${
                    apiParams.mapResults || 3000
                }`,
            ),
        snackMessages.fetchInstanceLocationError,

        {
            enabled: params.tab === 'map',
            select: result => result.instances,
        },
    );
    const { data, isFetching: fetchingList } = useSnackQuery(
        ['instances', apiParams],
        () => fetchInstancesAsDict(getEndpointUrl(apiParams)),
        snackMessages.fetchInstanceDictError,
        { keepPreviousData: true, enabled: !isLoadingPossibleFields },
    );
    // Move to delete when we port dialog to react-query
    const refetchInstances = () => queryClient.invalidateQueries(['instances']);

    const { data: formDetails } = useSnackQuery(
        ['formDetailsForInstance', `${formId}`],
        () => fetchFormDetailsForInstance(formId),
        undefined,
        { enabled: Boolean(formId) },
    );
    const labelKeys = formDetails?.label_keys ?? [];
    const formName = formDetails?.name ?? '';
    const periodType = formDetails?.period_type;
    const orgUnitTypes = formDetails?.org_unit_type_ids ?? [];

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
            dispatch(redirectToReplace(baseUrl, newParams));
        },
        [dispatch],
    );
    const CreateReAssignDialog = useMemo(
        () => makeFullModal(CreateReAssignDialogComponent, AddButtonComponent),
        [],
    );

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
                tableColumns={tableColumns}
            />

            <Box className={classes.containerFullHeightPadded}>
                <InstancesFiltersComponent
                    params={params}
                    onSearch={onSearch}
                    possibleFields={possibleFields}
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
                                    <CreateReAssignDialog
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
