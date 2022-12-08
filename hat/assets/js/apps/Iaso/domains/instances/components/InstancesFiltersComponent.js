import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
    Box,
    Button,
    Grid,
    makeStyles,
    Typography,
    useMediaQuery,
    useTheme,
} from '@material-ui/core';

import Search from '@material-ui/icons/Search';
import {
    commonStyles,
    useSafeIntl,
    QueryBuilderInput,
} from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';

import { periodTypeOptions } from '../../periods/constants';
import { isValidPeriod } from '../../periods/utils';
import DatesRange from '../../../components/filters/DatesRange';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { Period } from '../../periods/models';

import { INSTANCE_STATUSES } from '../constants';
import { setInstancesFilterUpdated } from '../actions';

import { useGetFormDescriptor } from '../compare/hooks/useGetInstanceLogs.ts';
import { useGetForms, useInstancesFiltersData } from '../hooks';
import { getInstancesFilterValues, useFormState } from '../../../hooks/form';
import { useGetQueryBuildersFields } from '../hooks/useGetQueryBuildersFields.ts';
import { parseJson } from '../utils/jsonLogicParse.ts';

import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';

import { LocationLimit } from '../../../utils/map/LocationLimit';
import { UserOrgUnitRestriction } from './UserOrgUnitRestriction';

export const instanceStatusOptions = INSTANCE_STATUSES.map(status => ({
    value: status,
    label: MESSAGES[status.toLowerCase()],
}));

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const filterDefault = params => ({
    ...params,
    mapResults: params.mapResults ? 3000 : params.mapResults,
});

const InstancesFiltersComponent = ({
    params: { formIds },
    params,
    onSearch,
    possibleFields,
}) => {
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    const [hasLocationLimitError, setHasLocationLimitError] = useState(false);
    const [fetchingOrgUnitTypes, setFetchingOrgUnitTypes] = useState(false);

    const defaultFilters = useMemo(() => {
        const filters = { ...params };
        delete filters.pageSize;
        delete filters.order;
        delete filters.page;
        return filters;
    }, [params]);
    const [formState, setFormState] = useFormState(
        filterDefault(defaultFilters),
    );

    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.levels);
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const isInstancesFilterUpdated = useSelector(
        state => state.instances.isInstancesFilterUpdated,
    );
    const { data, isFetching: fetchingForms } = useGetForms();
    const formsList = useMemo(() => data?.forms ?? [], [data]);

    const formId =
        formState.formIds.value?.split(',').length === 1
            ? formState.formIds.value.split(',')[0]
            : undefined;

    const { data: formDescriptor } = useGetFormDescriptor(formId);
    const fields = useGetQueryBuildersFields(formDescriptor, possibleFields);

    useInstancesFiltersData(formIds, setFetchingOrgUnitTypes);
    const handleSearch = useCallback(() => {
        if (isInstancesFilterUpdated) {
            dispatch(setInstancesFilterUpdated(false));
            const searchParams = {
                ...params,
                ...getInstancesFilterValues(formState),
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
        dispatch,
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
            dispatch(setInstancesFilterUpdated(true));
        },
        [dispatch, setFormState],
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
            } catch (e) {
                return true;
            }
        }
        return false;
    }, [formState.startPeriod, formState.endPeriod]);

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

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <div className={classes.marginBottomBig}>
            <UserOrgUnitRestriction />

            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleFormChange}
                        value={formState.search.value || null}
                        type="search"
                        label={MESSAGES.textSearch}
                        onEnterPressed={() => handleSearch()}
                    />
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
                    {formState.formIds.value?.split(',').length === 1 && (
                        <QueryBuilderInput
                            label={MESSAGES.queryBuilder}
                            onChange={handleChangeQueryBuilder}
                            initialLogic={
                                formState.fieldsSearch.value
                                    ? JSON.parse(formState.fieldsSearch.value)
                                    : undefined
                            }
                            fields={fields}
                            iconProps={{
                                label: MESSAGES.queryBuilder,
                                value: formState.fieldsSearch.value,
                                onClear: () =>
                                    handleFormChange('fieldsSearch', undefined),
                            }}
                        />
                    )}
                    <InputComponent
                        keyValue="showDeleted"
                        onChange={handleFormChange}
                        value={formState.showDeleted.value}
                        type="checkbox"
                        label={MESSAGES.showDeleted}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={3}>
                    <Box id="ou-tree-input">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.org_unit}
                            onConfirm={orgUnit =>
                                handleFormChange(
                                    'levels',
                                    orgUnit ? [orgUnit.id] : undefined,
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
                        options={orgUnitTypes.map(t => ({
                            label: t.name,
                            value: t.id,
                        }))}
                        label={MESSAGES.org_unit_type_id}
                        loading={fetchingOrgUnitTypes}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
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
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid
                    item
                    xs={12}
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Box mt={isLargeLayout ? 0 : 2}>
                        <Button
                            disabled={
                                !isInstancesFilterUpdated ||
                                periodError ||
                                startPeriodError ||
                                endPeriodError ||
                                hasLocationLimitError
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

InstancesFiltersComponent.defaultProps = {
    possibleFields: [],
};

InstancesFiltersComponent.propTypes = {
    params: PropTypes.object.isRequired,
    onSearch: PropTypes.func.isRequired,
    possibleFields: PropTypes.array,
};

export default InstancesFiltersComponent;
