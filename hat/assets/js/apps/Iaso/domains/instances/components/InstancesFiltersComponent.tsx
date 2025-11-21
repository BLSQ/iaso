import React, { useCallback, useMemo, useState } from 'react';
import Search from '@mui/icons-material/Search';
import { Box, Button, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    QueryBuilderInput,
    commonStyles,
    useHumanReadableJsonLogic,
    useSafeIntl,
    useSkipEffectOnMount,
    InputWithInfos,
} from 'bluesquare-components';
import DatesRange from '../../../components/filters/DatesRange';
import { AsyncSelect } from '../../../components/forms/AsyncSelect';
import InputComponent from '../../../components/forms/InputComponent';
import { UserOrgUnitRestriction } from '../../../components/UserOrgUnitRestriction';
import { getInstancesFilterValues, useFormState } from '../../../hooks/form';
import { LocationLimit } from '../../../utils/map/LocationLimit';
import { Popper } from '../../forms/fields/components/Popper';
import { useGetFormDescriptor } from '../../forms/fields/hooks/useGetFormDescriptor';
import { useGetQueryBuilderListToReplace } from '../../forms/fields/hooks/useGetQueryBuilderListToReplace';
import { useGetQueryBuildersFields } from '../../forms/fields/hooks/useGetQueryBuildersFields';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { periodTypeOptions } from '../../periods/constants';
import { Period } from '../../periods/models';
import { isValidPeriod } from '../../periods/utils';

import { useGetPlanningsOptions } from '../../plannings/hooks/requests/useGetPlannings';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { INSTANCE_STATUSES } from '../constants';

import { useGetForms } from '../hooks';
import { getUsersDropDown } from '../hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../hooks/useGetProfilesDropdown';
import MESSAGES from '../messages';
import { parseJson } from '../utils/jsonLogicParse';

import { ColumnSelect } from './ColumnSelect';

export const instanceStatusOptions = INSTANCE_STATUSES.map(status => ({
    value: status,
    label: MESSAGES[status.toLowerCase()],
}));

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

// TODO source full list of params elsewhere
const filterDefault = params => ({
    ...params,
    mapResults: params.mapResults ? 3000 : params.mapResults,
});

type Props = {
    params: any;
    onSearch: (params: any) => void;
    setFormIds: React.Dispatch<React.SetStateAction<any>>;
    setTableColumns: React.Dispatch<React.SetStateAction<any>>;
    baseUrl: string;
    tab: string;
    tableColumns: any[];
    labelKeys: any[];
    periodType?: string;
    possibleFields?: any[];
    formDetails?: any;
};

const InstancesFiltersComponent = ({
    params,
    onSearch,
    possibleFields = [],
    setFormIds,
    periodType,
    setTableColumns,
    baseUrl,
    labelKeys,
    formDetails,
    tableColumns,
    tab,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    const [isInstancesFilterUpdated, setIsInstancesFilterUpdated] =
        useState(false);
    const [hasLocationLimitError, setHasLocationLimitError] = useState(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    const defaultFilters = useMemo(() => {
        const filters = { ...params };
        delete filters.pageSize;
        delete filters.order;
        delete filters.page;
        filters.showDeleted = filters.showDeleted === 'true';
        return filters;
    }, [params]);

    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const [formState, setFormState] = useFormState(
        filterDefault(defaultFilters),
    );
    const [textSearchError, setTextSearchError] = useState(false);
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.levels);
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);
    const { data: planningsDropdownOptions, isFetching: fetchingPlannings } =
        useGetPlanningsOptions();
    useSkipEffectOnMount(() => {
        Object.entries(params).forEach(([key, value]) => {
            if (key === 'showDeleted') {
                setFormState(key, value === 'true');
            } else {
                setFormState(key, value);
            }
        });
        setInitialOrgUnitId(params?.levels);
    }, [defaultFilters]);
    const { data: orgUnitTypes, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data, isFetching: fetchingForms } = useGetForms();
    const formsList = useMemo(() => data?.forms ?? [], [data]);
    const formId =
        formState.formIds.value?.split(',').length === 1
            ? formState.formIds.value.split(',')[0]
            : undefined;

    const { data: formDescriptor } = useGetFormDescriptor(formId);
    const fields = useGetQueryBuildersFields(formDescriptor, possibleFields);
    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        fields,
        queryBuilderListToReplace,
    );
    const handleSearch = useCallback(() => {
        if (isInstancesFilterUpdated || params?.isSearchActive !== 'true') {
            setIsInstancesFilterUpdated(false);
            const searchParams = {
                ...params,
                ...getInstancesFilterValues(formState),
                isSearchActive: 'true',
                page: 1,
            };
            // removing columns params to refetch correct columns
            const newFormIdsString = formState.formIds.value;
            const newFormIds = formState.formIds.value?.split(',');
            if (newFormIdsString) {
                if (
                    formState.formIds.value !== params?.formIds &&
                    newFormIds.length === 1
                ) {
                    delete searchParams.columns;
                }
            }
            if (newFormIds?.length !== 1) {
                delete searchParams.fieldsSearch;
                setFormState('fieldsSearch', null);
            }
            onSearch(searchParams);
        }
    }, [
        isInstancesFilterUpdated,
        setIsInstancesFilterUpdated,
        params,
        formState,
        onSearch,
        setFormState,
    ]);

    const handleFormChange = useCallback(
        (key, value) => {
            // checking only as value can be null or false
            if (key === 'formIds') {
                setFormState('fieldsSearch', null);
                setFormIds(value ? value.split(',') : undefined);
            }
            if (key) {
                setFormState(key, value);
                if (key === 'periodType') {
                    setFormState('startPeriod', null);
                    setFormState('endPeriod', null);
                }
            }
            // saving the selected org unit in state to avoid losing it when navigating back from submission details
            if (key === 'levels') {
                setInitialOrgUnitId(value);
            }
            setIsInstancesFilterUpdated(true);
        },
        [setFormState, setFormIds, setIsInstancesFilterUpdated],
    );

    const startPeriodError = useMemo(() => {
        if (formState.startPeriod?.value && formState.periodType?.value) {
            return !isValidPeriod(
                formState.startPeriod.value,
                formState.periodType.value,
            );
        }
        return false;
    }, [formState.startPeriod, formState.periodType]);
    const endPeriodError = useMemo(() => {
        if (formState.endPeriod?.value && formState.periodType?.value) {
            return !isValidPeriod(
                formState.endPeriod.value,
                formState.periodType.value,
            );
        }
        return false;
    }, [formState.endPeriod, formState.periodType]);
    const periodError = useMemo(() => {
        if (formState.startPeriod?.value && formState.endPeriod?.value) {
            try {
                return !Period.isBeforeOrEqual(
                    formState.startPeriod.value,
                    formState.endPeriod.value,
                );
            } catch {
                return true;
            }
        }
        return false;
    }, [formState.startPeriod, formState.endPeriod]);
    const { data: selectedUsers } = useGetProfilesDropdown(
        formState.userIds.value,
    );

    const handleChangeQueryBuilder = value => {
        let parsedValue;
        if (value)
            parsedValue = parseJson({
                value,
                fields,
            });
        handleFormChange(
            'fieldsSearch',
            value ? JSON.stringify(parsedValue) : undefined,
        );
    };

    const joinValuesBeforeHandleFormChange = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleFormChange(keyValue, joined);
        },
        [handleFormChange],
    );

    const fieldsSearchJson = formState.fieldsSearch.value
        ? JSON.parse(formState.fieldsSearch.value)
        : undefined;
    const hasNoChangesToSearch =
        !isInstancesFilterUpdated ||
        periodError ||
        startPeriodError ||
        endPeriodError ||
        hasLocationLimitError;
    return (
        <div className={classes.marginBottom}>
            <UserOrgUnitRestriction />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <InputWithInfos
                        infos={formatMessage(MESSAGES.searchParams)}
                    >
                        <InputComponent
                            keyValue="search"
                            onChange={handleFormChange}
                            value={formState.search.value || ''}
                            type="search"
                            label={MESSAGES.textSearch}
                            onEnterPressed={() => handleSearch()}
                            onErrorChange={setTextSearchError}
                            blockForbiddenChars
                        />
                    </InputWithInfos>
                    <InputComponent
                        keyValue="projectIds"
                        onChange={handleFormChange}
                        value={formState.projectIds.value || null}
                        type="select"
                        options={allProjects}
                        label={MESSAGES.projects}
                        loading={isFetchingProjects}
                        multi
                    />
                    <InputWithInfos
                        infos={formatMessage(
                            MESSAGES.searchSubmissionFormsParamsInfo,
                        )}
                    >
                        <InputComponent
                            keyValue="formIds"
                            clearable
                            multi
                            onChange={handleFormChange}
                            value={formState.formIds.value || null}
                            type="select"
                            options={formsList.map(t => ({
                                label: t.name,
                                value: t.id,
                            }))}
                            label={MESSAGES.forms}
                            loading={fetchingForms}
                        />
                    </InputWithInfos>
                    {formState.formIds.value?.split(',').length === 1 && (
                        <QueryBuilderInput
                            label={MESSAGES.queryBuilder}
                            onChange={handleChangeQueryBuilder}
                            initialLogic={fieldsSearchJson}
                            fields={fields}
                            iconProps={{
                                label: MESSAGES.queryBuilder,
                                value: getHumanReadableJsonLogic(
                                    fieldsSearchJson,
                                ),
                                onClear: () =>
                                    handleFormChange('fieldsSearch', undefined),
                            }}
                            InfoPopper={<Popper />}
                        />
                    )}
                    <Box mt={2} height={40}>
                        <InputComponent
                            keyValue="showDeleted"
                            onChange={handleFormChange}
                            value={formState.showDeleted.value}
                            type="checkbox"
                            label={MESSAGES.showDeleted}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="status"
                        clearable
                        onChange={handleFormChange}
                        value={formState.status.value || null}
                        type="select"
                        options={instanceStatusOptions}
                        label={MESSAGES.exportStatus}
                    />
                    <InputComponent
                        keyValue="withLocation"
                        clearable
                        onChange={handleFormChange}
                        value={formState.withLocation.value || null}
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
                        label={MESSAGES.location}
                    />
                    <Box mt={2}>
                        <LocationLimit
                            onChange={handleFormChange}
                            value={formState.mapResults.value}
                            setHasError={setHasLocationLimitError}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box id="ou-tree-input">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.org_unit}
                            onConfirm={orgUnit =>
                                handleFormChange(
                                    'levels',
                                    orgUnit ? orgUnit.id : undefined,
                                )
                            }
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                    <InputComponent
                        keyValue="orgUnitTypeId"
                        clearable
                        multi
                        onChange={handleFormChange}
                        value={formState.orgUnitTypeId.value || null}
                        type="select"
                        options={orgUnitTypes || []}
                        label={MESSAGES.org_unit_type_id}
                        loading={isFetchingOuTypes}
                    />
                    <InputComponent
                        type="select"
                        multi
                        keyValue="planningIds"
                        onChange={handleFormChange}
                        value={formState.planningIds.value || null}
                        options={planningsDropdownOptions}
                        label={MESSAGES.planning}
                        loading={fetchingPlannings}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <DatesRange
                        xs={12}
                        sm={12}
                        md={12}
                        lg={6}
                        onChangeDate={handleFormChange}
                        dateFrom={formState.dateFrom?.value}
                        dateTo={formState.dateTo?.value}
                        labelFrom={MESSAGES.creationDateFrom}
                        labelTo={MESSAGES.creationDateTo}
                    />
                    <InputComponent
                        keyValue="periodType"
                        clearable
                        onChange={handleFormChange}
                        value={formState.periodType.value}
                        type="select"
                        options={periodTypeOptions}
                        label={MESSAGES.periodType}
                    />

                    <PeriodPicker
                        hasError={periodError || startPeriodError}
                        activePeriodString={formState.startPeriod.value}
                        periodType={formState.periodType.value}
                        title={formatMessage(MESSAGES.startPeriod)}
                        keyName="startPeriod"
                        onChange={startPeriod =>
                            handleFormChange('startPeriod', startPeriod)
                        }
                    />

                    <PeriodPicker
                        hasError={periodError || endPeriodError}
                        activePeriodString={formState.endPeriod.value}
                        periodType={formState.periodType.value}
                        title={formatMessage(MESSAGES.endPeriod)}
                        keyName="endPeriod"
                        onChange={endPeriod =>
                            handleFormChange('endPeriod', endPeriod)
                        }
                    />
                    {periodError && (
                        <Box mt={-1}>
                            <Typography
                                variant="body1"
                                color="error"
                                fontSize="small"
                            >
                                {formatMessage(MESSAGES.periodError)}
                            </Typography>
                        </Box>
                    )}
                    <Box mt={2}>
                        <AsyncSelect
                            keyValue="userIds"
                            label={MESSAGES.user}
                            value={selectedUsers ?? ''}
                            onChange={joinValuesBeforeHandleFormChange}
                            debounceTime={500}
                            multi
                            fetchOptions={input => getUsersDropDown(input)}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Box mt={-2}>
                {!showAdvancedSettings && (
                    <Box mt={2}>
                        <Typography
                            data-test="advanced-settings"
                            className={classes.advancedSettings}
                            variant="overline"
                            onClick={() => setShowAdvancedSettings(true)}
                        >
                            {formatMessage(MESSAGES.showAdvancedSettings)}
                        </Typography>
                    </Box>
                )}
                {showAdvancedSettings && (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Box data-test="modificationDate">
                                <DatesRange
                                    xs={12}
                                    sm={12}
                                    md={12}
                                    lg={6}
                                    keyDateFrom="modificationDateFrom"
                                    keyDateTo="modificationDateTo"
                                    onChangeDate={handleFormChange}
                                    dateFrom={
                                        formState.modificationDateFrom.value
                                    }
                                    dateTo={formState.modificationDateTo.value}
                                    labelFrom={MESSAGES.modificationDateFrom}
                                    labelTo={MESSAGES.modificationDateTo}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box data-test="sentDate">
                                <DatesRange
                                    xs={12}
                                    sm={12}
                                    md={12}
                                    lg={6}
                                    keyDateFrom="sentDateFrom"
                                    keyDateTo="sentDateTo"
                                    onChangeDate={handleFormChange}
                                    dateFrom={formState.sentDateFrom.value}
                                    dateTo={formState.sentDateTo.value}
                                    labelFrom={MESSAGES.sentDateFrom}
                                    labelTo={MESSAGES.sentDateTo}
                                />
                            </Box>
                        </Grid>
                        <Box ml={1}>
                            <Typography
                                data-test="advanced-settings"
                                className={classes.advancedSettings}
                                variant="overline"
                                onClick={() => setShowAdvancedSettings(false)}
                            >
                                {formatMessage(MESSAGES.hideAdvancedSettings)}
                            </Typography>
                        </Box>
                    </Grid>
                )}
            </Box>
            <Grid container spacing={2}>
                <Grid
                    item
                    xs={12}
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Box mt={2}>
                        {tab === 'list' && (
                            <Box mr={2} display="inline-block">
                                <ColumnSelect
                                    params={params}
                                    disabled={
                                        params.formIds !==
                                        formState.formIds.value
                                    }
                                    periodType={periodType}
                                    setTableColumns={newCols =>
                                        setTableColumns(newCols)
                                    }
                                    baseUrl={baseUrl}
                                    labelKeys={labelKeys}
                                    formDetails={formDetails}
                                    tableColumns={tableColumns}
                                />
                            </Box>
                        )}
                        <Button
                            disabled={
                                textSearchError ||
                                // Disable search button if a search is already active AND there are no new changes to search for
                                // This prevents unnecessary duplicate searches when filters haven't changed
                                (params?.isSearchActive === 'true' &&
                                    hasNoChangesToSearch)
                            }
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            data-test="search-button"
                            onClick={() => handleSearch()}
                        >
                            <Search className={classes.buttonIcon} />
                            {formatMessage(MESSAGES.search)}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
};

export default InstancesFiltersComponent;
