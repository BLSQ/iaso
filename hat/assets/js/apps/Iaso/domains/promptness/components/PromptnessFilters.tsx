import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box, Typography } from '@mui/material';
import {
    ActiveFiltersBar,
    ColorChip,
    FilterFieldDescriptor,
    FilterFieldRenderContext,
    FiltersDrawer,
    FilterValues,
    getClearedFilterValues,
    removeFilterFromValues,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import InputComponent from '../../../components/forms/InputComponent';
import { FormsDropdownOptions } from '../../forms/hooks/useGetFormsDropdownOptions';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { PERIOD_TYPE_PLACEHOLDER } from '../../periods/constants';
import PERIOD_MESSAGES from '../../periods/messages';
import { Period } from '../../periods/models';
import { getCurrentPeriodString, useFormatPeriod } from '../../periods/utils';
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
    // The org unit whose figures are displayed: the parent, or one drilled down below it
    orgUnitId?: string;
};

const baseUrl = baseUrls.promptness;

// Wider than the default drawer (400px): the period picker needs room to show the year
const DRAWER_WIDTH = 520;

type FormOption = NonNullable<FormsDropdownOptions>[number];

const findForm = (
    forms: FormsDropdownOptions | undefined,
    formId: unknown,
): FormOption['original'] | undefined =>
    forms?.find(form => `${form.value}` === `${formId ?? ''}`)?.original;

// The period has to follow the period type of the form: it is kept when its
// type matches, otherwise it is replaced by the current period
const getPeriodForForm = (
    form: FormOption['original'] | undefined,
    period?: string,
): string | undefined => {
    const periodType = form?.period_type;
    if (!periodType) {
        return undefined;
    }
    if (period && Period.getPeriodType(period) === periodType) {
        return period;
    }
    return getCurrentPeriodString(periodType);
};

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

type OrgUnitTypesInputProps = {
    form?: FormOption['original'];
    value?: string;
    onChange: (value?: string) => void;
};

// The org unit types depend on the projects of the form selected in the drawer:
// a component of its own to fetch them with a hook
const OrgUnitTypesInput: FunctionComponent<OrgUnitTypesInputProps> = ({
    form,
    value,
    onChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: orgUnitTypes, isFetching } =
        useGetOrgUnitTypesDropdownOptions({
            projectIds: form?.project_ids,
            enabled: Boolean(form),
        });
    return (
        <InputComponent
            type="select"
            keyValue="orgUnitTypeIds"
            onChange={(_key, newValue?: string) => onChange(newValue)}
            value={value}
            label={MESSAGES.orgUnitTypes}
            options={orgUnitTypes ?? []}
            loading={isFetching}
            // Only when nothing is selected, the chips are enough otherwise
            placeholder={value ? undefined : formatMessage(MESSAGES.allTypes)}
            helperText={formatMessage(
                value
                    ? MESSAGES.orgUnitTypesSelectedInfo
                    : MESSAGES.orgUnitTypesInfo,
            )}
            multi
            // the drawer already spaces fields
            withMarginTop={false}
        />
    );
};

export const PromptnessFilters: FunctionComponent<Props> = ({
    params,
    forms,
    isFetchingForms,
    orgUnitId,
}) => {
    const { formatMessage } = useSafeIntl();
    const getStatusColor = useGetStatusColor();
    const formatPeriod = useFormatPeriod();
    const { data: initialParent } = useGetOrgUnit(orgUnitId, ORG_UNIT_FIELDS);
    // Org unit types of the applied form, to name them in the chips
    const appliedForm = findForm(forms, params.formId);
    const { data: orgUnitTypes } = useGetOrgUnitTypesDropdownOptions({
        projectIds: appliedForm?.project_ids,
        enabled: Boolean(appliedForm),
    });

    const getPeriodTypeLabel = useCallback(
        (periodType?: string | null) =>
            periodType
                ? formatMessage(
                      PERIOD_MESSAGES[
                          periodType.toLowerCase() as keyof typeof PERIOD_MESSAGES
                      ],
                  ).toLowerCase()
                : undefined,
        [formatMessage],
    );
    const getFormErrors = useCallback(
        (form?: FormOption['original']): string[] => {
            if (form?.promptness_grace_period_days === null) {
                return [formatMessage(MESSAGES.formNoGracePeriod)];
            }
            return [];
        },
        [formatMessage],
    );

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

    const fields: FilterFieldDescriptor[] = useMemo(
        () => [
            {
                key: 'formId',
                label: MESSAGES.form,
                type: 'custom',
                required: true,
                formatValue: (value?: string) =>
                    forms?.find(form => `${form.value}` === `${value ?? ''}`)
                        ?.label,
                renderCustom: ({
                    value,
                    onChange,
                }: FilterFieldRenderContext) => (
                    <InputComponent
                        type="select"
                        keyValue="formId"
                        onChange={(_key, newValue) => onChange(newValue)}
                        value={value}
                        label={MESSAGES.form}
                        loading={isFetchingForms}
                        options={forms ?? []}
                        errors={getFormErrors(findForm(forms, value))}
                        placeholder={formatMessage(MESSAGES.selectForm)}
                        required
                        withMarginTop={false}
                    />
                ),
            },
            {
                key: 'period',
                label: MESSAGES.period,
                type: 'custom',
                required: true,
                formatValue: (value?: string) =>
                    value ? formatPeriod(value) : undefined,
                renderCustom: ({
                    value,
                    values: draftValues,
                    onChange,
                }: FilterFieldRenderContext) => {
                    // The form selected in the drawer, not yet applied
                    const draftForm = findForm(forms, draftValues.formId);
                    const periodTypeLabel = getPeriodTypeLabel(
                        draftForm?.period_type,
                    );
                    return (
                        <Box>
                            {/* The period picker depends on the period type of the form */}
                            {!draftForm && (
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
                            {draftForm && (
                                <PeriodPicker
                                    // Reset the picker when the period type changes
                                    key={draftForm.period_type}
                                    title={`${formatMessage(MESSAGES.period)} *`}
                                    periodType={
                                        draftForm.period_type ??
                                        PERIOD_TYPE_PLACEHOLDER
                                    }
                                    onChange={newPeriod => onChange(newPeriod)}
                                    activePeriodString={getPeriodForForm(
                                        draftForm,
                                        value,
                                    )}
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
                    );
                },
            },
            {
                key: 'parentId',
                label: MESSAGES.parent,
                type: 'custom',
                required: true,
                // Only the applied org unit is displayed in the chip
                formatValue: (value?: string) =>
                    `${initialParent?.id ?? ''}` === `${value ?? ''}`
                        ? initialParent?.name
                        : value,
                renderCustom: ({ onChange }: FilterFieldRenderContext) => (
                    <OrgUnitTreeviewModal
                        titleMessage={MESSAGES.parent}
                        onConfirm={(orgUnit?: { id: number }) =>
                            onChange(orgUnit?.id ? `${orgUnit.id}` : undefined)
                        }
                        initialSelection={initialParent}
                        required
                    />
                ),
            },
            {
                key: 'status',
                label: MESSAGES.status,
                type: 'custom',
                required: true,
                formatValue: (value?: string) =>
                    value
                        ?.split(',')
                        .map(
                            status =>
                                statusOptions.find(
                                    option => option.value === status,
                                )?.label ?? status,
                        ),
                renderCustom: ({
                    value,
                    onChange,
                }: FilterFieldRenderContext) => (
                    <InputComponent
                        type="select"
                        keyValue="status"
                        onChange={(_key, newValue?: string) => {
                            if (newValue) {
                                onChange(newValue);
                            }
                        }}
                        value={value ?? PROMPTNESS_STATUSES.join(',')}
                        label={MESSAGES.status}
                        options={statusOptions}
                        helperText={formatMessage(MESSAGES.statusInfo)}
                        renderTags={renderStatusTags}
                        clearable={false}
                        required
                        multi
                        withMarginTop={false}
                    />
                ),
            },
            {
                key: 'orgUnitTypeIds',
                label: MESSAGES.orgUnitTypes,
                type: 'custom',
                formatValue: (value?: string) =>
                    value
                        ?.split(',')
                        .map(
                            id =>
                                orgUnitTypes?.find(
                                    type => `${type.value}` === id,
                                )?.label ?? id,
                        ),
                renderCustom: ({
                    value,
                    values: draftValues,
                    onChange,
                }: FilterFieldRenderContext) => (
                    <OrgUnitTypesInput
                        form={findForm(forms, draftValues.formId)}
                        value={value}
                        onChange={onChange}
                    />
                ),
            },
        ],
        [
            forms,
            isFetchingForms,
            formatMessage,
            formatPeriod,
            getPeriodTypeLabel,
            getFormErrors,
            initialParent,
            statusOptions,
            renderStatusTags,
            orgUnitTypes,
        ],
    );
    const values: FilterValues = useMemo(
        () => ({
            formId: params.formId,
            period: params.period,
            parentId: orgUnitId,
            status: params.status,
            orgUnitTypeIds: params.orgUnitTypeIds,
        }),
        [
            params.formId,
            params.period,
            params.status,
            params.orgUnitTypeIds,
            orgUnitId,
        ],
    );
    const redirectTo = useRedirectTo();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const handleApply = useCallback(
        (next: FilterValues) => {
            const nextForm = findForm(forms, next.formId);
            const parentChanged =
                `${next.parentId ?? ''}` !== `${orgUnitId ?? ''}`;
            redirectTo(baseUrl, {
                ...params,
                ...(parentChanged && {
                    parentId: next.parentId || undefined,
                    orgUnitId: undefined,
                }),
                formId: next.formId || undefined,
                period: getPeriodForForm(nextForm, next.period),
                status: next.status || undefined,
                orgUnitTypeIds: next.orgUnitTypeIds || undefined,
            });
        },
        [forms, orgUnitId, params, redirectTo],
    );

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <Box flexGrow={1} minWidth={0}>
                <ActiveFiltersBar
                    fields={fields}
                    values={values}
                    onOpenFilters={() => setIsDrawerOpen(true)}
                    onRemoveFilter={key =>
                        handleApply(removeFilterFromValues(values, key, fields))
                    }
                    onClearAll={() =>
                        handleApply(getClearedFilterValues(fields, values))
                    }
                />
                <FiltersDrawer
                    open={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    fields={fields}
                    values={values}
                    onApply={handleApply}
                    width={DRAWER_WIDTH}
                />
            </Box>
        </Box>
    );
};
