import { Box, Grid } from '@mui/material';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    useSafeIntl,
    useSkipEffectOnMount,
    UrlParams,
} from 'bluesquare-components';
import uniq from 'lodash/uniq';
import intersection from 'lodash/intersection';
import isEqual from 'lodash/isEqual';
import { FilterButton } from '../../components/FilterButton';
import InputComponent from '../../components/forms/InputComponent';
import { baseUrls } from '../../constants/urls';
import { useFilterState } from '../../hooks/useFilterState';
import { OrgUnitTreeviewModal } from '../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../orgUnits/components/TreeView/requests';
import { useGetOrgUnitTypesOptions } from './hooks/api/useGetOrgUnitTypesOptions';
import MESSAGES from './messages';
import PeriodPicker from '../periods/components/PeriodPicker';
import { useGetPlanningsOptions } from '../plannings/hooks/requests/useGetPlannings';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import { useGetGroups } from '../orgUnits/hooks/requests/useGetGroups';
import { PERIOD_TYPE_PLACEHOLDER } from '../periods/constants';
import { useGetValidationStatus } from '../forms/hooks/useGetValidationStatus';
import { InputWithInfos } from '../../components/InputWithInfos';
import { DropdownOptionsWithOriginal } from '../../types/utils';
import { useGetTeamsDropdown } from '../teams/hooks/requests/useGetTeams';
import { AsyncSelect } from '../../components/forms/AsyncSelect';
import { getUsersDropDown } from '../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../instances/hooks/useGetProfilesDropdown';
import { useRedirectToReplace } from '../../routing/routing';
import { PLANNINGS } from '../../utils/permissions';

type Props = {
    params: UrlParams & any;
    forms?: DropdownOptionsWithOriginal<number>[];
    fetchingForms: boolean;
};

const baseUrl = baseUrls.completenessStats;

export const CompletenessStatsFilters: FunctionComponent<Props> = ({
    params,
    forms,
    fetchingForms,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();

    const { filters, handleChange, filtersUpdated, setFiltersUpdated } =
        useFilterState({
            baseUrl,
            params,
        });
    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            redirectToReplace(baseUrl, tempParams);
        }
    }, [filtersUpdated, setFiltersUpdated, params, filters, redirectToReplace]);
    const [initialParentId, setInitialParentId] = useState(params?.parentId);
    const { data: initialParent } = useGetOrgUnit(initialParentId);

    const { data: orgUnitTypes, isFetching: fetchingTypes } =
        useGetOrgUnitTypesOptions(filters.parentId);
    const { data: availablePlannings, isFetching: fetchingPlannings } =
        useGetPlanningsOptions(filters.formId);
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsDropdown({});
    useSkipEffectOnMount(() => {
        setInitialParentId(params?.parentId);
    }, [params]);
    const { data: groups, isFetching: isFetchingGroups } = useGetGroups({});

    const { data: selectedUsers } = useGetProfilesDropdown(filters.userIds);

    // React to org unit type filtering, if the type is not available anymore
    // we remove it
    useEffect(() => {
        if (filters.orgUnitTypeIds && orgUnitTypes) {
            const out: string = filters.orgUnitTypeIds as string;
            const selectedOrgUnitIDs = out
                .split(',')
                .map(x => parseInt(x, 10))
                .sort();
            const availableIds = orgUnitTypes.map(
                orgUnitType => orgUnitType.value,
            );

            const filteredIds = intersection(
                availableIds,
                selectedOrgUnitIDs,
            ).sort();

            if (!isEqual(filteredIds, selectedOrgUnitIDs)) {
                handleChange('orgUnitTypeIds', filteredIds.join(','));
            }
        }
    }, [handleChange, orgUnitTypes, filters.orgUnitTypeIds]);

    const periodType = useMemo(() => {
        if (filters.formId && forms) {
            const formIdStr = filters.formId as string;
            const selectedFormIds = formIdStr
                .split(',')
                .map(x => parseInt(x, 10))
                .sort();
            const selectedForms = forms.filter(
                f => selectedFormIds.indexOf(f.value) !== -1,
            );

            const periods = selectedForms
                .map(f => f.original.period_type)
                .filter(periodType_ => Boolean(periodType_));
            const uniqPeriods = uniq(periods);
            return uniqPeriods && uniqPeriods[0]
                ? uniqPeriods[0]
                : PERIOD_TYPE_PLACEHOLDER;
        }
        return PERIOD_TYPE_PLACEHOLDER;
    }, [filters, forms]);

    const handleParentChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialParentId(id);
            handleChange('parentId', id);
        },
        [handleChange],
    );

    const handleChangeForm = useCallback(
        (keyValue, value) => {
            handleChange('planningId', undefined);
            handleChange(keyValue, value);
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

    const {
        data: validationStatusOptions,
        isLoading: isLoadingValidationStatusOptions,
    } = useGetValidationStatus();
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputWithInfos infos={formatMessage(MESSAGES.formsInfos)}>
                        <InputComponent
                            type="select"
                            onChange={handleChangeForm}
                            keyValue="formId"
                            label={MESSAGES.form}
                            value={filters.formId}
                            loading={fetchingForms}
                            options={forms ?? []}
                            multi
                        />
                    </InputWithInfos>
                    <PeriodPicker
                        message={
                            periodType === PERIOD_TYPE_PLACEHOLDER
                                ? formatMessage(MESSAGES.periodPlaceHolder)
                                : undefined
                        }
                        periodType={periodType}
                        title={formatMessage(MESSAGES.period)}
                        onChange={v => handleChange('period', v)}
                        activePeriodString={filters?.period as string}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        disabled={isFetchingGroups}
                        keyValue="groupId"
                        onChange={handleChange}
                        value={filters?.groupId}
                        label={MESSAGES.group}
                        options={groups}
                        loading={isFetchingGroups}
                    />
                    <DisplayIfUserHasPerm permissions={[PLANNINGS]}>
                        <InputComponent
                            type="select"
                            onChange={handleChange}
                            keyValue="planningId"
                            label={MESSAGES.planning}
                            value={filters.planningId}
                            loading={fetchingPlannings}
                            options={availablePlannings ?? []}
                        />
                    </DisplayIfUserHasPerm>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Box id="ou-tree-input-parent">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.parent}
                            onConfirm={handleParentChange}
                            initialSelection={initialParent}
                        />
                    </Box>
                    <InputComponent
                        type="select"
                        clearable={false}
                        multi
                        keyValue="orgunitValidationStatus"
                        onChange={handleChange}
                        loading={isLoadingValidationStatusOptions}
                        value={filters.orgunitValidationStatus}
                        label={MESSAGES.validationStatus}
                        options={validationStatusOptions || []}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        onChange={handleChange}
                        keyValue="orgUnitTypeIds"
                        multi
                        label={MESSAGES.orgUnitTypeGroupBy}
                        value={filters.orgUnitTypeIds}
                        loading={fetchingTypes}
                        options={orgUnitTypes ?? []}
                    />
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
                        keyValue="teamsIds"
                        onChange={handleChange}
                        value={filters.teamsIds}
                        type="select"
                        options={teamsDropdown}
                        label={MESSAGES.teams}
                        loading={isFetchingTeams}
                        multi
                    />
                </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mb={1} mt={2}>
                <FilterButton
                    disabled={!filtersUpdated}
                    onFilter={handleSearch}
                />
            </Box>
        </>
    );
};
