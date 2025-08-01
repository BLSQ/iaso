import React, { useCallback, useMemo, useState } from 'react';
import { Box, Grid, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    selectionInitialState,
    setTableSelection,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import snackMessages from '../../components/snackBars/messages';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useSnackQuery } from '../../libs/apiHooks';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import * as Permission from '../../utils/permissions';
import { useGetPossibleFields } from '../forms/hooks/useGetPossibleFields';
import { createInstance } from './actions';
import { CreateReAssignDialog } from './components/CreateReAssignDialogComponent';
import InstancesFiltersComponent from './components/InstancesFiltersComponent';
import { InstancesMap } from './components/InstancesMap/InstancesMap';
import { PaginatedInstancesFilesList } from './components/PaginatedInstancesFilesList';
import { InstancesTopBar as TopBar } from './components/TopBar';
import MESSAGES from './messages';
import {
    fetchFormDetailsForInstance,
    fetchInstancesAsDict,
    fetchInstancesAsSmallDict,
} from './requests';
import {
    getEndpointUrl,
    getExportUrl,
    useGetFilters,
    useSelectionActions,
} from './utils/index';

const baseUrl = baseUrls.instances;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
}));

const Instances = () => {
    const params = useParamsObject(baseUrl);

    const isSearchActive = params?.isSearchActive === 'true';
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const queryClient = useQueryClient();
    const redirectToReplace = useRedirectToReplace();
    const [selection, setSelection] = useState(selectionInitialState);
    const [tableColumns, setTableColumns] = useState([]);
    const [tab, setTab] = useState(params.tab ?? 'list');

    const [formIds, setFormIds] = useState(params.formIds?.split(','));
    const formId = formIds?.length === 1 ? formIds[0] : undefined;
    const showTable = tab === 'list' && tableColumns.length > 0;
    const { possibleFields, isFetchingForm: isLoadingPossibleFields } =
        useGetPossibleFields(formId ? parseInt(formId, 10) : undefined);
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
                    params.mapResults || 3000
                }`,
            ),
        snackMessages.fetchInstanceLocationError,

        {
            enabled: params.tab === 'map',
            select: result => result.instances,
        },
    );
    const { data, isFetching: fetchingList } = useSnackQuery({
        queryKey: ['instances', apiParams, showTable],
        queryFn: () => fetchInstancesAsDict(getEndpointUrl(apiParams, false)),
        snackErrorMsg: snackMessages.fetchInstanceDictError,
        options: {
            keepPreviousData: true,
            enabled: !isLoadingPossibleFields && showTable && isSearchActive,
        },
    });
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
            redirectToReplace(baseUrl, newParams);
        },
        [params, redirectToReplace],
    );

    const onSearch = useCallback(
        newParams => {
            setSelection(selectionInitialState);
            redirectToReplace(baseUrl, newParams);
        },
        [redirectToReplace],
    );
    const isSingleFormSearch = params.formIds?.split(',').length === 1;
    const filters = useGetFilters(params);
    const selectionActions = useSelectionActions(
        filters,
        () => refetchInstances(),
        params.showDeleted === 'true',
        classes,
    );

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
                            <DisplayIfUserHasPerm
                                permissions={[Permission.SUBMISSIONS_UPDATE]}
                            >
                                <Box
                                    display="flex"
                                    justifyContent="flex-end"
                                    mb={2}
                                >
                                    <CreateReAssignDialog
                                        iconProps={{}}
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
                                        onCreateOrReAssign={payload =>
                                            createInstance(payload)
                                        }
                                    />
                                </Box>
                            </DisplayIfUserHasPerm>
                        </Grid>
                    </Grid>
                )}
                {isSearchActive && (
                    <Box display="flex" justifyContent="flex-end">
                        <Tooltip
                            title={
                                isSingleFormSearch
                                    ? ''
                                    : formatMessage(MESSAGES.filterParam)
                            }
                            arrow
                        >
                            <Box>
                                <DownloadButtonsComponent
                                    csvUrl={getExportUrl(params, 'csv')}
                                    xlsxUrl={getExportUrl(params, 'xlsx')}
                                    disabled={!isSingleFormSearch}
                                />
                            </Box>
                        </Tooltip>
                    </Box>
                )}
                {showTable && (
                    <TableWithDeepLink
                        data={data?.instances ?? []}
                        pages={data?.pages}
                        count={data?.count}
                        params={params}
                        columns={tableColumns}
                        baseUrl={baseUrl}
                        multiSelect
                        defaultSorted={[{ id: 'updated_at', desc: true }]}
                        selectionActions={selectionActions}
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
                        noDataMessage={
                            !isSearchActive
                                ? MESSAGES.searchToSeeSubmissions
                                : undefined
                        }
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
                    <PaginatedInstancesFilesList
                        params={params}
                        updateParams={onSearch}
                    />
                )}
            </Box>
        </section>
    );
};

export default Instances;
