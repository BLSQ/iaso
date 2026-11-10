import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { ColorChip, useSafeIntl } from 'bluesquare-components';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { SxStyles } from 'Iaso/types/general';
import InputComponent from '../../../components/forms/InputComponent';
import { FormsDropdownOptions } from '../../forms/hooks/useGetFormsDropdownOptions';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { PERIOD_TYPE_PLACEHOLDER } from '../../periods/constants';
import PERIOD_MESSAGES from '../../periods/messages';
import { getCurrentPeriodString } from '../../periods/utils';
import {
    ORG_UNIT_FIELDS,
    PROMPTNESS_STATUSES,
    STATUS_MESSAGES,
} from '../constants';
import MESSAGES from '../messages';
import { PromptnessRouterParams, PromptnessStatus } from '../types';
import { useGetStatusColor } from '../utils';

type Props = {
    params: PromptnessRouterParams;
    forms?: FormsDropdownOptions;
    isFetchingForms: boolean;
    orgUnitId?: string;
};

const baseUrl = baseUrls.promptness;

const styles: SxStyles = {
    periodHelper: {
        display: 'block',
        color: 'text.secondary',
        mt: -1.5,
        ml: 1.5,
    },
    buttons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 2,
    },
};

export const PromptnessFilters: FunctionComponent<Props> = ({
    params,
    forms,
    isFetchingForms,
    orgUnitId,
}) => {
    const { formatMessage } = useSafeIntl();
    const {
        filters,
        handleChange,
        handleSearch,
        filtersUpdated,
        setFilters,
        setFiltersUpdated,
    } = useFilterState({ baseUrl, params, saveSearchInHistory: false });
    const getStatusColor = useGetStatusColor();
    const selectedForm = useMemo(
        () =>
            forms?.find(form => `${form.value}` === `${filters.formId ?? ''}`)
                ?.original,
        [forms, filters.formId],
    );
    const { data: initialParent } = useGetOrgUnit(orgUnitId, ORG_UNIT_FIELDS);
    const { data: orgUnitTypes, isFetching: isFetchingTypes } =
        useGetOrgUnitTypesDropdownOptions({
            projectIds: selectedForm?.project_ids,
            enabled: Boolean(selectedForm),
        });

    const onChangeStatus = useCallback(
        (keyValue: string, value?: string) => {
            if (!value) {
                return;
            }
            handleChange(keyValue, value);
        },
        [handleChange],
    );

    const periodType = selectedForm?.period_type ?? PERIOD_TYPE_PLACEHOLDER;
    const periodTypeLabel = selectedForm?.period_type
        ? formatMessage(
              PERIOD_MESSAGES[
                  selectedForm.period_type.toLowerCase() as keyof typeof PERIOD_MESSAGES
              ],
          ).toLowerCase()
        : undefined;
    const getFormErrors = (): string[] => {
        if (selectedForm?.promptness_grace_period_days === null) {
            return [formatMessage(MESSAGES.formNoGracePeriod)];
        }
        return [];
    };

    const statusOptions = useMemo(
        () =>
            PROMPTNESS_STATUSES.map(status => ({
                value: status,
                label: formatMessage(STATUS_MESSAGES[status]),
            })),
        [formatMessage],
    );

    // Selected statuses are displayed with their own color
    const renderStatusTags = useCallback(
        (
            tags: { value: PromptnessStatus; label: string }[],
            getTagProps: (args: { index: number }) => Record<string, unknown>,
        ) =>
            tags.map((tag, index) => (
                <ColorChip
                    {...getTagProps({ index })}
                    key={tag.value}
                    label={tag.label}
                    color={getStatusColor(tag.value)}
                />
            )),
        [getStatusColor],
    );

    const handleChangeForm = useCallback(
        (keyValue: string, value?: number) => {
            const newForm = forms?.find(form => form.value === value);
            // The period has to follow the period type of the form,
            // the current one by default
            const newPeriodType = newForm?.original.period_type;
            const keepPeriod =
                Boolean(filters.period) &&
                newPeriodType === selectedForm?.period_type;
            setFilters({
                ...filters,
                [keyValue]: value ?? undefined,
                period: keepPeriod
                    ? filters.period
                    : newPeriodType && getCurrentPeriodString(newPeriodType),
            });
            setFiltersUpdated(true);
        },
        [filters, forms, selectedForm, setFilters, setFiltersUpdated],
    );

    const handleChangeParent = useCallback(
        (orgUnit?: { id: number }) => {
            // A new parent org unit also resets the drill down
            setFilters({
                ...filters,
                parentId: orgUnit?.id,
                orgUnitId: undefined,
            });
            setFiltersUpdated(true);
        },
        [filters, setFilters, setFiltersUpdated],
    );

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} lg={4}>
                    <InputComponent
                        type="select"
                        keyValue="formId"
                        onChange={handleChangeForm}
                        value={filters.formId}
                        label={MESSAGES.form}
                        loading={isFetchingForms}
                        options={forms ?? []}
                        errors={getFormErrors()}
                        placeholder={formatMessage(MESSAGES.selectForm)}
                        required
                    />
                    <InputComponent
                        type="select"
                        keyValue="status"
                        onChange={onChangeStatus}
                        value={filters.status ?? PROMPTNESS_STATUSES.join(',')}
                        label={MESSAGES.status}
                        options={statusOptions}
                        helperText={formatMessage(MESSAGES.statusInfo)}
                        renderTags={renderStatusTags}
                        clearable={false}
                        required
                        multi
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                    <Box>
                        {/* The period picker depends on the period type of the form */}
                        {!selectedForm && (
                            <InputComponent
                                type="select"
                                keyValue="period"
                                label={MESSAGES.period}
                                placeholder={formatMessage(
                                    MESSAGES.selectFormFirst,
                                )}
                                options={[]}
                                required
                                disabled
                            />
                        )}
                        {selectedForm && (
                            <PeriodPicker
                                title={`${formatMessage(MESSAGES.period)} *`}
                                periodType={periodType}
                                onChange={value =>
                                    handleChange('period', value)
                                }
                                activePeriodString={filters.period}
                            />
                        )}
                        {periodTypeLabel && (
                            <Typography
                                variant="caption"
                                sx={styles.periodHelper}
                            >
                                {formatMessage(MESSAGES.periodInfo, {
                                    periodType: periodTypeLabel,
                                })}
                            </Typography>
                        )}
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                    <OrgUnitTreeviewModal
                        titleMessage={MESSAGES.parent}
                        onConfirm={handleChangeParent}
                        initialSelection={initialParent}
                        required
                    />
                    <InputComponent
                        type="select"
                        keyValue="orgUnitTypeIds"
                        onChange={handleChange}
                        value={filters.orgUnitTypeIds}
                        label={MESSAGES.orgUnitTypes}
                        options={orgUnitTypes ?? []}
                        loading={isFetchingTypes}
                        // Only when nothing is selected, the chips are enough otherwise
                        placeholder={
                            filters.orgUnitTypeIds
                                ? undefined
                                : formatMessage(MESSAGES.allTypes)
                        }
                        helperText={formatMessage(
                            filters.orgUnitTypeIds
                                ? MESSAGES.orgUnitTypesSelectedInfo
                                : MESSAGES.orgUnitTypesInfo,
                        )}
                        multi
                    />
                </Grid>
            </Grid>
            <Box sx={styles.buttons}>
                <SearchButton
                    disabled={!filtersUpdated}
                    onSearch={handleSearch}
                />
            </Box>
        </>
    );
};
