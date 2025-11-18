import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Box, Grid, Typography } from '@mui/material';
import {
    InputWithInfos,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';

import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { AsyncSelect } from 'Iaso/components/forms/AsyncSelect';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { useCheckBoxFilter, useFilterState } from 'Iaso/hooks/useFilterState';
import { DropdownOptions } from 'Iaso/types/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import DatesRange from '../../../../components/filters/DatesRange';
import InputComponent from '../../../../components/forms/InputComponent';
import * as Permission from '../../../../utils/permissions';
import {
    useGetDataSourceVersionsSynchronizationDropdown,
    useSearchDataSourceVersionsSynchronization,
} from '../../../dataSources/hooks/useGetDataSourceVersionsSynchronizationDropdown';
import { useDefaultSourceVersion } from '../../../dataSources/utils';
import { getUsersDropDown } from '../../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../../instances/hooks/useGetProfilesDropdown';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { useGetUserRolesDropDown } from '../../../userRoles/hooks/requests/useGetUserRoles';
import { useGetForms } from '../../../workflows/hooks/requests/useGetForms';
import { OrgUnitTreeviewModal } from '../../components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../components/TreeView/requests';
import { useGetDataSources } from '../../hooks/requests/useGetDataSources';
import { useGetGroupDropdown } from '../../hooks/requests/useGetGroups';
import { useGetVersionLabel } from '../../hooks/useGetVersionLabel';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { PAYMENTS_MODULE } from '../constants';
import { usePaymentStatusOptions } from '../hooks/api/useGetPaymentStatusOptions';
import MESSAGES from '../messages';
import { ApproveOrgUnitParams } from '../types';

const baseUrl = baseUrls.orgUnitsChangeRequest;

type Props = {
    params: ApproveOrgUnitParams;
};

const styles = {
    advancedSettings: {
        color: theme => theme.palette.primary.main,
        alignSelf: 'center',
        textAlign: 'right',
        flex: '1',
        cursor: 'pointer',
    },
};

export const ReviewOrgUnitChangesFilter: FunctionComponent<Props> = ({
    params,
}) => {
    const currentUser = useCurrentUser();
    const { modules } = currentUser.account;
    const redirectToReplace = useRedirectToReplace();

    const defaultSourceVersion = useDefaultSourceVersion();
    const [selectedVersionId, setSelectedVersionId] = useState<string>(
        params.source_version_id
            ? params.source_version_id
            : defaultSourceVersion?.version?.id.toString(),
    );

    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: dataSources, isFetching: isFetchingDataSources } =
        useGetDataSources(true);
    const { data: initialOrgUnit } = useGetOrgUnit(params.parent_id);
    const { data: orgUnitTypeOptions, isLoading: isLoadingTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: forms, isFetching: isLoadingForms } = useGetForms();
    const { data: selectedUsers } = useGetProfilesDropdown(filters.userIds);
    const { data: userRoles, isFetching: isFetchingUserRoles } =
        useGetUserRolesDropDown();

    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const { data: paymentStatuses, isFetching: isFetchingPaymentStatuses } =
        usePaymentStatusOptions();

    const updateParams = (paramsToUpdate, selectedVersion) => {
        return {
            ...paramsToUpdate,
            source_version_id: selectedVersion,
        };
    };

    // Redirect to default version
    useEffect(() => {
        if (!params.source_version_id) {
            const updatedParams = updateParams(params, selectedVersionId);
            redirectToReplace(baseUrl, updatedParams);
        }
    }, [selectedVersionId, redirectToReplace, params]);

    // Get the source when the source_version_id exists
    const sourceParam = useMemo(
        () =>
            params.source_version_id
                ? dataSources?.filter(source =>
                      source.original.versions.some(
                          version =>
                              version.id.toString() ===
                              params.source_version_id,
                      ),
                  )?.[0]?.value
                : undefined,
        [dataSources, params.source_version_id],
    );

    const [dataSource, setDataSource] = useState<string>(
        sourceParam || defaultSourceVersion?.source?.id.toString(),
    );
    const formOptions = useMemo(
        () =>
            forms?.map(form => ({
                label: form.name,
                value: form.id,
            })) || [],
        [forms],
    );
    // Get the initial data source id
    const initialDataSource = useMemo(
        () =>
            dataSources?.find(
                source =>
                    source.value ===
                    defaultSourceVersion?.source?.id.toString(),
            )?.value || '',
        [dataSources, defaultSourceVersion?.source?.id],
    );

    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const { formatMessage } = useSafeIntl();

    const { data: groupOptions, isLoading: isLoadingGroups } =
        useGetGroupDropdown(
            selectedVersionId ? { defaultVersion: selectedVersionId } : {},
        );

    // Change the selected dataSource
    useEffect(() => {
        const updatedDataSource =
            sourceParam ||
            dataSources?.find(
                source =>
                    source.value ===
                    defaultSourceVersion?.source?.id.toString(),
            )?.value;

        if (updatedDataSource) {
            setDataSource(updatedDataSource as unknown as string);
        }
    }, [
        dataSources,
        defaultSourceVersion?.source?.id,
        setDataSource,
        sourceParam,
    ]);

    const statusOptions: DropdownOptions<string>[] = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.new),
                value: 'new',
            },
            {
                label: formatMessage(MESSAGES.rejected),
                value: 'rejected',
            },
            {
                label: formatMessage(MESSAGES.approved),
                value: 'approved',
            },
        ],
        [formatMessage],
    );

    const requestedFieldsOptions = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.name),
                value: 'name',
            },
            {
                label: formatMessage(MESSAGES.parent),
                value: 'parent',
            },
            {
                label: formatMessage(MESSAGES.orgUnitType),
                value: 'org_unit_type',
            },
            {
                label: formatMessage(MESSAGES.openingDate),
                value: 'opening_date',
            },
            {
                label: formatMessage(MESSAGES.closingDate),
                value: 'closed_date',
            },
            {
                label: formatMessage(MESSAGES.location),
                value: 'location',
            },
            {
                label: formatMessage(MESSAGES.groups),
                value: 'groups',
            },
            {
                label: formatMessage(MESSAGES.multiReferenceInstancesLabel),
                value: 'reference_instances',
            },
        ],
        [formatMessage],
    );

    const kindOptions = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.orgUnitCreation),
                value: 'org_unit_creation',
            },
            {
                label: formatMessage(MESSAGES.orgUnitChange),
                value: 'org_unit_change',
            },
        ],
        [formatMessage],
    );

    // Convert comma-separated string to array for multi-select component.
    const requestedFieldsValue = useMemo(() => {
        if (!filters.requested_fields) return [];
        return filters.requested_fields
            .split(',')
            .filter(field => field.trim() !== '');
    }, [filters.requested_fields]);

    const handleChangeRequestedFields = useCallback(
        (keyValue, newValue) => {
            if (!newValue || newValue.length === 0) {
                handleChange(keyValue, null);
                return;
            }
            const joined = Array.isArray(newValue)
                ? newValue.join(',')
                : newValue;
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    // Handle Data Source Versions Synchronization.
    // If the `data_source_synchronization_id` URL param exists, fetch the corresponding item.
    const {
        data: dataSourceVersionsSynchronization,
        isLoading: isLoadingDataSourceVersionsSynchronization,
    } = useGetDataSourceVersionsSynchronizationDropdown(
        filters.data_source_synchronization_id,
    );

    const { searchWithInput } = useSearchDataSourceVersionsSynchronization();

    const fetchSynchronizationOptions = useCallback(
        (input: string) => searchWithInput(input),
        [searchWithInput],
    );

    const handleChangeDataSourceVersionsSynchronization = useCallback(
        (keyValue, newDataSourceVersionsSynchronization) => {
            const id: number = newDataSourceVersionsSynchronization?.value;
            // Set the value of `data_source_synchronization_id` URL param.
            handleChange(keyValue, id);
        },
        [handleChange],
    );

    // handle dataSource and sourceVersion change
    const handleDataSourceVersionChange = useCallback(
        (key, newValue) => {
            let selectedVersion;
            if (key === 'source') {
                setDataSource(newValue);
                const selectedSource = dataSources?.filter(
                    source => source.value === newValue,
                )[0];

                selectedVersion =
                    selectedSource?.original?.default_version.id.toString();
            } else {
                selectedVersion = newValue.toString();
            }
            // Reset the group filter state
            handleChange('groups', null);
            filters.groups = null;

            // Reset selected version
            setSelectedVersionId(selectedVersion || '');
            if (selectedVersion) {
                handleChange('source_version_id', selectedVersion);
            }
            // Reset the parent_id
            filters.parent_id = null;
        },
        [dataSources, filters, handleChange],
    );

    const handleChangeIds = useCallback(
        (key, newValue) => {
            const ids: string = newValue
                .split(/[\s,]+/)
                // Remove empty elements.
                .filter(i => i)
                .join(',');
            handleChange(key, ids);
        },
        [handleChange],
    );

    const getVersionLabel = useGetVersionLabel(dataSources);
    // Get the versions dropdown options based on the selected dataSource
    const versionsDropDown = useMemo(() => {
        if (!dataSources || !dataSource) return [];
        return (
            dataSources
                .filter(
                    src => (src.value as unknown as string) === dataSource,
                )[0]
                ?.original?.versions.sort((a, b) => a.number - b.number)
                .map(version => ({
                    label: getVersionLabel(version.id),
                    value: version.id.toString(),
                })) ?? []
        );
    }, [dataSource, dataSources, getVersionLabel]);
    // Reset the OrgUnitTreeviewModal when the sourceVersion changed
    const sourceTreeviewResetControl = useRef(selectedVersionId);
    useEffect(() => {
        if (sourceTreeviewResetControl.current !== selectedVersionId) {
            sourceTreeviewResetControl.current = selectedVersionId;
        }
    }, [selectedVersionId]);

    const {
        checkBoxValue: softDeleted,
        handleCheckboxChange: handleSoftDeleted,
    } = useCheckBoxFilter({
        initialValue: filters.is_soft_deleted === 'true',
        handleChange,
        keyValue: 'is_soft_deleted',
    });

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    keyValue="projectIds"
                    onChange={handleChange}
                    value={filters.projectIds}
                    type="select"
                    options={allProjects}
                    label={MESSAGES.projects}
                    loading={isFetchingProjects}
                    onEnterPressed={handleSearch}
                    clearable
                    multi
                />
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="status"
                    value={filters.status}
                    onChange={handleChange}
                    options={statusOptions}
                    labelString={formatMessage(MESSAGES.status)}
                />
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="kind"
                    value={filters.kind}
                    onChange={handleChange}
                    options={kindOptions}
                    labelString={formatMessage(MESSAGES.kind)}
                />
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="groups"
                    value={filters.groups}
                    onChange={handleChange}
                    options={groupOptions}
                    loading={isLoadingGroups}
                    labelString={formatMessage(MESSAGES.group)}
                />
                <Box mt={2}>
                    <InputComponent
                        type="select"
                        disabled={isFetchingDataSources}
                        keyValue="source"
                        onChange={handleDataSourceVersionChange}
                        value={isFetchingDataSources ? '' : dataSource}
                        label={MESSAGES.source}
                        options={dataSources}
                        loading={isFetchingDataSources}
                    />
                    {!showAdvancedSettings && (
                        <Typography
                            data-test="advanced-settings"
                            variant="overline"
                            sx={styles.advancedSettings}
                            onClick={() => setShowAdvancedSettings(true)}
                        >
                            {formatMessage(MESSAGES.showAdvancedSettings)}
                        </Typography>
                    )}
                    {showAdvancedSettings && (
                        <>
                            <InputComponent
                                type="select"
                                disabled={isFetchingDataSources}
                                keyValue="version"
                                onChange={handleDataSourceVersionChange}
                                value={selectedVersionId || ''}
                                label={MESSAGES.sourceVersion}
                                options={versionsDropDown}
                                clearable={false}
                                loading={isFetchingDataSources}
                            />

                            <Box ml={1}>
                                <Typography
                                    data-test="advanced-settings"
                                    variant="overline"
                                    onClick={() =>
                                        setShowAdvancedSettings(false)
                                    }
                                >
                                    {formatMessage(
                                        MESSAGES.hideAdvancedSettings,
                                    )}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <InputWithInfos
                    infos={formatMessage(MESSAGES.searchOrgUnitInfos)}
                >
                    <InputComponent
                        type="text"
                        clearable
                        keyValue="org_unit"
                        value={filters.org_unit}
                        onChange={handleChange}
                        labelString={formatMessage(MESSAGES.orgUnit)}
                    />
                </InputWithInfos>
                <Box id="ou-tree-input">
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.parent}
                        source={
                            dataSource
                                ? dataSource.toString()
                                : initialDataSource.toString()
                        }
                        version={selectedVersionId}
                        onConfirm={orgUnit => {
                            handleChange('parent_id', orgUnit?.id);
                        }}
                        initialSelection={initialOrgUnit}
                        resetTrigger={
                            sourceTreeviewResetControl.current !==
                            selectedVersionId
                        }
                    />
                </Box>
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="org_unit_type_id"
                    value={filters.org_unit_type_id}
                    onChange={handleChange}
                    loading={isLoadingTypes}
                    options={orgUnitTypeOptions}
                    labelString={formatMessage(MESSAGES.orgUnitType)}
                />
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="requested_fields"
                    value={requestedFieldsValue}
                    onChange={handleChangeRequestedFields}
                    options={requestedFieldsOptions}
                    labelString={formatMessage(MESSAGES.requestedFields)}
                />
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="forms"
                    value={filters.forms}
                    onChange={handleChange}
                    options={formOptions}
                    loading={isLoadingForms}
                    labelString={formatMessage(MESSAGES.forms)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <Box mt={2}>
                    <AsyncSelect
                        keyValue="userIds"
                        label={MESSAGES.user}
                        value={selectedUsers ?? ''}
                        onChange={handleChangeUsers}
                        debounceTime={500}
                        multi
                        fetchOptions={input => getUsersDropDown(input)}
                    />
                </Box>
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="userRoles"
                    value={filters.userRoles}
                    onChange={handleChange}
                    loading={isFetchingUserRoles}
                    options={userRoles}
                    labelString={formatMessage(MESSAGES.userRoles)}
                />
                <InputComponent
                    keyValue="withLocation"
                    clearable
                    onChange={handleChange}
                    value={filters.withLocation || null}
                    type="select"
                    options={[
                        {
                            label: formatMessage(MESSAGES.with),
                            value: 'true',
                        },
                        {
                            label: formatMessage(MESSAGES.without),
                            value: 'false',
                        },
                    ]}
                />
                <DisplayIfUserHasPerm
                    permissions={[
                        Permission.SOURCE_WRITE,
                        Permission.ORG_UNITS_CHANGE_REQUESTS_CONFIGURATION,
                        Permission.ORG_UNITS,
                    ]}
                    strict
                >
                    <Box mt={2}>
                        <AsyncSelect
                            keyValue="data_source_synchronization_id"
                            clearable
                            label={MESSAGES.dataSourceVersionsSynchronization}
                            value={dataSourceVersionsSynchronization ?? ''}
                            loading={isLoadingDataSourceVersionsSynchronization}
                            onChange={
                                handleChangeDataSourceVersionsSynchronization
                            }
                            debounceTime={500}
                            fetchOptions={fetchSynchronizationOptions}
                        />
                    </Box>
                </DisplayIfUserHasPerm>
                {modules.includes(PAYMENTS_MODULE) && (
                    <InputComponent
                        label={MESSAGES.location}
                        type="select"
                        clearable
                        keyValue="paymentStatus"
                        value={filters.paymentStatus}
                        onChange={handleChange}
                        loading={isFetchingPaymentStatuses}
                        options={paymentStatuses}
                        labelString={formatMessage(MESSAGES.paymentStatus)}
                    />
                )}
            </Grid>

            <Grid item xs={12} md={4} lg={3}>
                <InputWithInfos infos={formatMessage(MESSAGES.searchByIdsInfo)}>
                    <InputComponent
                        keyValue="ids"
                        value={filters.ids}
                        type="search"
                        label={MESSAGES.searchByIds}
                        blockForbiddenChars
                        onChange={handleChangeIds}
                    />
                </InputWithInfos>
                <DatesRange
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                    keyDateFrom="created_at_after"
                    keyDateTo="created_at_before"
                    onChangeDate={handleChange}
                    dateFrom={filters.created_at_after}
                    dateTo={filters.created_at_before}
                    labelFrom={MESSAGES.createdDateFrom}
                    labelTo={MESSAGES.createdDateTo}
                />
                <InputComponent
                    keyValue="is_soft_deleted"
                    onChange={handleSoftDeleted}
                    value={softDeleted}
                    type="checkbox"
                    label={MESSAGES.isSoftDeleted}
                />
                <Box mt={2} mb={2} display="flex" justifyContent="flex-end">
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
