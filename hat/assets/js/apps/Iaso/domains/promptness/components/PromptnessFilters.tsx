import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { CsvSvg, useSafeIntl } from 'bluesquare-components';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { SxStyles } from 'Iaso/types/general';
import InputComponent from '../../../components/forms/InputComponent';
import { FormsDropdownOptions } from '../../forms/hooks/useGetFormsDropdownOptions';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { PERIOD_TYPE_PLACEHOLDER } from '../../periods/constants';
import PERIOD_MESSAGES from '../../periods/messages';
import { PROMPTNESS_STATUSES, STATUS_MESSAGES } from '../constants';
import { useGetOrgUnitTypesOptions } from '../hooks/api/useGetOrgUnitTypesOptions';
import {
    getPromptnessCsvUrl,
    hasRequiredFilters,
} from '../hooks/api/usePromptnessStats';
import MESSAGES from '../messages';
import { PromptnessRouterParams } from '../types';
import { getNotApplicableTypeIds } from '../utils';
import { OrgUnitTypesSelect } from './OrgUnitTypesSelect';

type Props = {
    params: PromptnessRouterParams;
    forms?: FormsDropdownOptions;
    isFetchingForms: boolean;
    orgUnitId: string;
};

const baseUrl = baseUrls.promptness;

const styles: SxStyles = {
    filters: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
        },
        columnGap: 2,
        alignItems: 'start',
    },
    // The period picker has a bottom margin, unlike the other inputs
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

    const { data: initialParent } = useGetOrgUnit(orgUnitId);
    const { data: orgUnitTypes, isFetching: isFetchingTypes } =
        useGetOrgUnitTypesOptions(filters.parentId);

    const onChangeStatus = useCallback(
        (keyValue: string, value?: string) => {
            if (!value) {
                return;
            }
            handleChange(keyValue, value);
        },
        [handleChange],
    );

    const selectedForm = useMemo(
        () =>
            forms?.find(form => `${form.value}` === `${filters.formId ?? ''}`)
                ?.original,
        [forms, filters.formId],
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
        if (!filters.formId) {
            return [formatMessage(MESSAGES.formRequired)];
        }
        if (selectedForm?.promptness_grace_period_days === null) {
            return [formatMessage(MESSAGES.formNoGracePeriod)];
        }
        return [];
    };

    const notApplicableTypeIds = useMemo(
        () =>
            getNotApplicableTypeIds(
                (orgUnitTypes ?? []).map(type => type.original),
                selectedForm?.org_unit_type_ids,
                selectedForm?.org_unit_group_ids,
            ),
        [orgUnitTypes, selectedForm],
    );

    const statusOptions = useMemo(
        () =>
            PROMPTNESS_STATUSES.map(status => ({
                value: status,
                label: formatMessage(STATUS_MESSAGES[status]),
            })),
        [formatMessage],
    );

    const handleChangeForm = useCallback(
        (keyValue: string, value?: number) => {
            const newForm = forms?.find(form => form.value === value);
            // The period has to follow the period type of the form
            const keepPeriod =
                newForm?.original.period_type === selectedForm?.period_type;
            setFilters({
                ...filters,
                [keyValue]: value ?? undefined,
                period: keepPeriod ? filters.period : undefined,
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
            <Box sx={styles.filters}>
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
                            onChange={value => handleChange('period', value)}
                            activePeriodString={filters.period}
                        />
                    )}
                    {periodTypeLabel && (
                        <Typography variant="caption" sx={styles.periodHelper}>
                            {formatMessage(MESSAGES.periodInfo, {
                                periodType: periodTypeLabel,
                            })}
                        </Typography>
                    )}
                </Box>
                <OrgUnitTreeviewModal
                    titleMessage={MESSAGES.parent}
                    onConfirm={handleChangeParent}
                    initialSelection={initialParent}
                    required
                />
                <OrgUnitTypesSelect
                    value={filters.orgUnitTypeIds}
                    onChange={handleChange}
                    options={orgUnitTypes ?? []}
                    notApplicableTypeIds={notApplicableTypeIds}
                    loading={isFetchingTypes}
                    helperText={formatMessage(
                        filters.orgUnitTypeIds
                            ? MESSAGES.orgUnitTypesSelectedInfo
                            : MESSAGES.orgUnitTypesInfo,
                    )}
                />
                <InputComponent
                    type="select"
                    keyValue="status"
                    onChange={onChangeStatus}
                    // All the statuses by default
                    value={filters.status ?? PROMPTNESS_STATUSES.join(',')}
                    // value={filters.status}
                    label={MESSAGES.status}
                    options={statusOptions}
                    helperText={formatMessage(MESSAGES.statusInfo)}
                    clearable={false}
                    required
                    multi
                />
            </Box>
            <Box sx={styles.buttons}>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CsvSvg />}
                    href={getPromptnessCsvUrl(params)}
                    disabled={!hasRequiredFilters(params)}
                >
                    {formatMessage(MESSAGES.exportCsv)}
                </Button>
                <SearchButton
                    disabled={!filtersUpdated}
                    onSearch={handleSearch}
                />
            </Box>
        </>
    );
};
