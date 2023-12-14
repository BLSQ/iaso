import React, { useCallback, useState, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';

import PropTypes from 'prop-types';

import {
    commonStyles,
    selectionInitialState,
    setTableSelection,
    useSafeIntl,
    LoadingSpinner,
} from 'bluesquare-components';

import { useQueryClient } from 'react-query';
import { createInstance } from './actions';
import { redirectToReplace } from '../../routing/actions.ts';
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
} from './utils/index.tsx';

import { InstancesTopBar as TopBar } from './components/TopBar.tsx';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent.tsx';
import { InstancesMap } from './components/InstancesMap/InstancesMap.tsx';
import InstancesFiltersComponent from './components/InstancesFiltersComponent';
import { CreateReAssignDialog } from './components/CreateReAssignDialogComponent.tsx';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';
import { useSnackQuery } from '../../libs/apiHooks.ts';
import snackMessages from '../../components/snackBars/messages';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink.tsx';
import { PaginatedInstanceFiles } from './components/PaginatedInstancesFiles';
import { useGetPossibleFields } from '../forms/hooks/useGetPossibleFields.ts';
import { userHasPermission } from '../users/utils';
import { useCurrentUser } from '../../utils/usersUtils.ts';

import * as Permission from '../../utils/permissions.ts';

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

    const [formIds, setFormIds] = useState(params.formIds?.split(','));
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
    const isSingleFormSearch = params.formIds?.split(',').length === 1;
    const currentUser = useCurrentUser();

    return (
        <section className={classes.relativeContainer}>
            <TopBar
                formName={formName}
                tab={tab}
                handleChangeTab={newTab => handleChangeTab(newTab)}
                formIds={formIds}
            />
            <Box className={classes.containerFullHeightPadded}>
                <InstancesFiltersComponent
                    params={params}
                    onSearch={onSearch}
                    possibleFields={possibleFields}
                    setFormIds={setFormIds}
                    periodType={periodType}
                    setTableColumns={setTableColumns}
                    baseUrl={baseUrl}
                    labelKeys={labelKeys}
                    formDetails={formDetails}
                    tableColumns={tableColumns}
                    tab={tab}
                />
                {tab === 'list' && isSingleFormSearch && (
                    <Grid container spacing={0} alignItems="center">
                        <Grid xs={12} item className={classes.textAlignRight}>
                            {userHasPermission(
                                Permission.SUBMISSIONS_UPDATE,
                                currentUser,
                            ) && (
                                <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    mb={2}
                                >
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
                                </Box>
                            )}

                            <Box display="flex" justifyContent="flex-end">
                                <DownloadButtonsComponent
                                    csvUrl={getExportUrl(params, 'csv')}
                                    xlsxUrl={getExportUrl(params, 'xlsx')}
                                />
                            </Box>
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
                        {loadingMap && <LoadingSpinner absolute />}
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
