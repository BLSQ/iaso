import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { FilterButton } from '../../../../components/FilterButton';
import { useFilterState } from '../../../../hooks/useFilterState';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../components/TreeView/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { DropdownOptions } from '../../../../types/utils';
import DatesRange from '../../../../components/filters/DatesRange';
import { useGetForms } from '../../../workflows/hooks/requests/useGetForms';
import { ApproveOrgUnitParams } from '../types';
import { AsyncSelect } from '../../../../components/forms/AsyncSelect';
import { getUsersDropDown } from '../../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../../instances/hooks/useGetProfilesDropdown';
import { useGetUserRolesDropDown } from '../../../userRoles/hooks/requests/useGetUserRoles';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { usePaymentStatusOptions } from '../hooks/api/useGetPaymentStatusOptions';
import { useGetGroupDropdown } from '../../hooks/requests/useGetGroups';
import { useGetDataSources } from '../../hooks/requests/useGetDataSources';
import { useDefaultSourceVersion } from '../../../dataSources/utils';
import { useGetVersionLabel } from '../../hooks/useGetVersionLabel';

const baseUrl = baseUrls.orgUnitsChangeRequest;
type Props = { params: ApproveOrgUnitParams };
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    advancedSettings: {
        color: theme.palette.primary.main,
        alignSelf: 'center',
        textAlign: 'right',
        flex: '1',
        cursor: 'pointer',
    },
}));
export const ReviewOrgUnitChangesFilter: FunctionComponent<Props> = ({
    params,
}) => {
    const classes = useStyles();

    const defaultSourceVersion = useDefaultSourceVersion();

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

    const formOptions = useMemo(
        () =>
            forms?.map(form => ({
                label: form.name,
                value: form.id,
            })) || [],
        [forms],
    );
    const initialDataSource = useMemo(
        () =>
            dataSources?.find(
                source =>
                    source.value === defaultSourceVersion.source.id.toString(),
            )?.value || '',
        [dataSources, defaultSourceVersion.source.id],
    );

    const [selectedVersionId, setSelectedVersionId] = useState(
        defaultSourceVersion.version.id,
    );
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [dataSource, setDataSource] = useState(initialDataSource);

    const { formatMessage } = useSafeIntl();

    const {
        data: groupOptions,
        isLoading: isLoadingGroups,
        refetch: refetchGroups,
    } = useGetGroupDropdown(
        selectedVersionId ? { defaultVersion: selectedVersionId } : {},
    );

    useEffect(() => {
        if (selectedVersionId) {
            refetchGroups();
        }
    }, [selectedVersionId, refetchGroups]);

    useEffect(() => {
        const updatedDataSource = dataSources?.find(
            source =>
                source.value === defaultSourceVersion.source.id.toString(),
        )?.value;

        if (updatedDataSource) {
            setDataSource(updatedDataSource);
        }
    }, [dataSources, defaultSourceVersion.source.id]);

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
    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    const handleDataSourceVersionChange = (key, newValue) => {
        if (key === 'source') {
            setDataSource(newValue);
            const selectedSource = dataSources?.filter(
                source => source.value === newValue,
            )[0];
            setSelectedVersionId(selectedSource?.original?.default_version.id);
            handleChange(
                'source_version_id',
                selectedSource?.original?.default_version.id,
            );
        } else {
            setSelectedVersionId(newValue);
            handleChange('source_version_id', newValue);
        }
        filters.groups = [];
    };

    const getVersionLabel = useGetVersionLabel(dataSources);

    const versionsDropDown = useMemo(() => {
        if (!dataSources || !dataSource) return [];
        return (
            dataSources
                .filter(src => src.value === dataSource)[0]
                ?.original?.versions.sort((a, b) => a.number - b.number)
                .map(version => ({
                    label: getVersionLabel(version.id),
                    value: version.id.toString(),
                })) ?? []
        );
    }, [dataSource, dataSources, getVersionLabel]);

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
                    keyValue="groups"
                    value={filters.groups}
                    onChange={handleChange}
                    options={groupOptions}
                    loading={isLoadingGroups}
                    labelString={formatMessage(MESSAGES.group)}
                />
                <Box mt={2}>
                    {!showAdvancedSettings && (
                        <Typography
                            data-test="advanced-settings"
                            variant="overline"
                            className={classes.advancedSettings}
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
                                keyValue="source"
                                onChange={handleDataSourceVersionChange}
                                value={isFetchingDataSources ? '' : dataSource}
                                label={MESSAGES.source}
                                options={dataSources}
                                loading={isFetchingDataSources}
                            />
                            <InputComponent
                                type="select"
                                disabled={isFetchingDataSources}
                                keyValue="version"
                                onChange={handleDataSourceVersionChange}
                                value={selectedVersionId.toString()}
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
            </Grid>

            <Grid item xs={12} md={4} lg={3}>
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
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
