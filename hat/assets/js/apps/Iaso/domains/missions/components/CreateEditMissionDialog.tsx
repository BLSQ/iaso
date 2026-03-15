import React, { FunctionComponent, ReactNode, useCallback, useMemo, useState } from 'react';
import { Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSafeIntl } from 'bluesquare-components';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { useFormState } from '../../../hooks/form';
import { useGetFormsDropdownOptions } from '../../forms/hooks/useGetFormsDropdownOptions';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetEntityTypesDropdown } from '../../entities/hooks/requests';
import { useSaveMission } from '../hooks/requests/useSaveMission';
import MESSAGES from '../messages';
import { Mission, MissionFormEntry } from '../types';

const missionTypeOptions = [
    { value: 'FORM_FILLING', label: 'Form Filling' },
    { value: 'ORG_UNIT_AND_FORM', label: 'Org Unit and Form' },
    { value: 'ENTITY_AND_FORM', label: 'Entity and Form' },
];

type MissionFormState = {
    form_id: number;
    form_name: string;
    min_cardinality: number;
    max_cardinality: number | null;
};

const buildMissionFormsState = (
    missionForms?: MissionFormEntry[],
): MissionFormState[] => {
    if (!missionForms) return [];
    return missionForms.map(mf => ({
        form_id: mf.form.id,
        form_name: mf.form.name,
        min_cardinality: mf.min_cardinality,
        max_cardinality: mf.max_cardinality,
    }));
};

const mapMission = (mission?: Partial<Mission>) => ({
    id: mission?.id ?? null,
    name: mission?.name ?? '',
    mission_type: mission?.mission_type ?? '',
    org_unit_type_id: mission?.org_unit_type?.id ?? null,
    org_unit_min_cardinality: mission?.org_unit_min_cardinality ?? null,
    org_unit_max_cardinality: mission?.org_unit_max_cardinality ?? null,
    entity_type_id: mission?.entity_type?.id ?? null,
    entity_min_cardinality: mission?.entity_min_cardinality ?? null,
    entity_max_cardinality: mission?.entity_max_cardinality ?? null,
});

type Props = {
    mission?: Mission;
    renderTrigger: ({ openDialog }: { openDialog: () => void }) => ReactNode;
};

export const CreateEditMissionDialog: FunctionComponent<Props> = ({
    mission,
    renderTrigger,
}) => {
    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState(mapMission(mission));
    const [missionForms, setMissionForms] = useState<MissionFormState[]>(
        buildMissionFormsState(mission?.mission_forms),
    );

    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveMission } = useSaveMission();
    const { data: formsOptions } = useGetFormsDropdownOptions({});
    const { data: orgUnitTypesOptions } = useGetOrgUnitTypesDropdownOptions({});
    const { data: entityTypesOptions } = useGetEntityTypesDropdown();

    const isCreate = !mission?.id;
    const titleMessage = isCreate ? MESSAGES.createMission : MESSAGES.editMission;

    const localizedMissionTypeOptions = useMemo(
        () =>
            missionTypeOptions.map(opt => ({
                ...opt,
                label: MESSAGES[opt.value]
                    ? formatMessage(MESSAGES[opt.value])
                    : opt.label,
            })),
        [formatMessage],
    );

    const missionType = formState.mission_type?.value;

    const showForms =
        missionType === 'FORM_FILLING' ||
        missionType === 'ORG_UNIT_AND_FORM' ||
        missionType === 'ENTITY_AND_FORM';
    const showOrgUnitType = missionType === 'ORG_UNIT_AND_FORM';
    const showEntityType = missionType === 'ENTITY_AND_FORM';

    // Forms already selected — exclude them from the dropdown
    const selectedFormIds = useMemo(
        () => new Set(missionForms.map(mf => mf.form_id)),
        [missionForms],
    );
    const availableFormsOptions = useMemo(
        () => (formsOptions || []).filter(opt => !selectedFormIds.has(Number(opt.value))),
        [formsOptions, selectedFormIds],
    );

    const handleAddForm = useCallback(
        (_key: string, value: string) => {
            if (!value) return;
            const formId = Number(value);
            const formOption = (formsOptions || []).find(
                opt => Number(opt.value) === formId,
            );
            if (!formOption) return;
            setMissionForms(prev => [
                ...prev,
                {
                    form_id: formId,
                    form_name: formOption.label,
                    min_cardinality: 1,
                    max_cardinality: null,
                },
            ]);
        },
        [formsOptions],
    );

    const handleRemoveForm = useCallback((formId: number) => {
        setMissionForms(prev => prev.filter(mf => mf.form_id !== formId));
    }, []);

    const handleFormCardinalityChange = useCallback(
        (formId: number, field: 'min_cardinality' | 'max_cardinality', value: string) => {
            const numValue = value === '' || value === null || value === undefined
                ? null
                : Number(value);
            setMissionForms(prev =>
                prev.map(mf =>
                    mf.form_id === formId
                        ? { ...mf, [field]: numValue }
                        : mf,
                ),
            );
        },
        [],
    );

    const onChange = useCallback(
        (keyValue: string, value: any) => {
            setFieldValue(keyValue, value);
        },
        [setFieldValue],
    );

    const resetForm = useCallback(() => {
        setFormState(mapMission(mission));
        setMissionForms(buildMissionFormsState(mission?.mission_forms));
    }, [mission, setFormState]);

    const allowConfirm = Boolean(
        formState.name?.value && formState.mission_type?.value,
    );

    const onConfirm = useCallback(
        (closeDialog: () => void) => {
            const payload: any = {
                name: formState.name.value,
                mission_type: formState.mission_type.value,
                mission_forms: missionForms.map(mf => ({
                    form_id: mf.form_id,
                    min_cardinality: mf.min_cardinality ?? 1,
                    max_cardinality: mf.max_cardinality,
                })),
            };
            if (formState.id.value) {
                payload.id = formState.id.value;
            }
            if (showOrgUnitType) {
                payload.org_unit_type = formState.org_unit_type_id.value;
                payload.org_unit_min_cardinality = formState.org_unit_min_cardinality.value;
                payload.org_unit_max_cardinality = formState.org_unit_max_cardinality.value;
            }
            if (showEntityType) {
                payload.entity_type = formState.entity_type_id.value;
                payload.entity_min_cardinality = formState.entity_min_cardinality.value;
                payload.entity_max_cardinality = formState.entity_max_cardinality.value;
            }

            saveMission(payload, {
                onSuccess: () => {
                    closeDialog();
                    resetForm();
                },
                onError: (error: any) => {
                    if (error.status === 400 && error.details) {
                        Object.entries(error.details).forEach(
                            ([key, errors]: [string, any]) => {
                                setFieldErrors(key, errors);
                            },
                        );
                    }
                },
            });
        },
        [formState, missionForms, saveMission, resetForm, setFieldErrors, showOrgUnitType, showEntityType],
    );

    return (
        <ConfirmCancelDialogComponent
            id="mission-modal"
            titleMessage={titleMessage}
            onConfirm={closeDialog => onConfirm(closeDialog)}
            onCancel={closeDialog => {
                closeDialog();
                resetForm();
            }}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            allowConfirm={allowConfirm}
            maxWidth="md"
            renderTrigger={renderTrigger}
            dataTestId="mission-modal"
        >
            <InputComponent
                keyValue="name"
                onChange={onChange}
                value={formState.name.value}
                errors={formState.name.errors}
                type="text"
                label={MESSAGES.name}
                required
            />
            <InputComponent
                keyValue="mission_type"
                onChange={onChange}
                value={formState.mission_type.value}
                errors={formState.mission_type.errors}
                type="select"
                options={localizedMissionTypeOptions}
                label={MESSAGES.missionType}
                required
            />
            {showOrgUnitType && (
                <>
                    <InputComponent
                        keyValue="org_unit_type_id"
                        onChange={onChange}
                        value={formState.org_unit_type_id.value}
                        errors={formState.org_unit_type_id.errors}
                        type="select"
                        options={orgUnitTypesOptions || []}
                        label={MESSAGES.orgUnitType}
                        required
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <InputComponent
                                keyValue="org_unit_min_cardinality"
                                onChange={onChange}
                                value={formState.org_unit_min_cardinality.value}
                                errors={formState.org_unit_min_cardinality.errors}
                                type="number"
                                label={MESSAGES.minCardinality}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <InputComponent
                                keyValue="org_unit_max_cardinality"
                                onChange={onChange}
                                value={formState.org_unit_max_cardinality.value}
                                errors={formState.org_unit_max_cardinality.errors}
                                type="number"
                                label={MESSAGES.maxCardinality}
                            />
                        </Grid>
                    </Grid>
                </>
            )}
            {showEntityType && (
                <>
                    <InputComponent
                        keyValue="entity_type_id"
                        onChange={onChange}
                        value={formState.entity_type_id.value}
                        errors={formState.entity_type_id.errors}
                        type="select"
                        options={entityTypesOptions || []}
                        label={MESSAGES.entityType}
                        required
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <InputComponent
                                keyValue="entity_min_cardinality"
                                onChange={onChange}
                                value={formState.entity_min_cardinality.value}
                                errors={formState.entity_min_cardinality.errors}
                                type="number"
                                label={MESSAGES.minCardinality}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <InputComponent
                                keyValue="entity_max_cardinality"
                                onChange={onChange}
                                value={formState.entity_max_cardinality.value}
                                errors={formState.entity_max_cardinality.errors}
                                type="number"
                                label={MESSAGES.maxCardinality}
                            />
                        </Grid>
                    </Grid>
                </>
            )}
            {showForms && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        {formatMessage(MESSAGES.forms)}
                    </Typography>
                    <InputComponent
                        keyValue="add_form"
                        onChange={handleAddForm}
                        value={null}
                        type="select"
                        options={availableFormsOptions}
                        label={MESSAGES.addForm}
                        clearable
                    />
                    {missionForms.map(mf => (
                        <Box
                            key={mf.form_id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                                p: 1,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                            }}
                        >
                            <Typography
                                sx={{ flex: 1, minWidth: 120 }}
                                variant="body2"
                            >
                                {mf.form_name}
                            </Typography>
                            <Box sx={{ width: 100 }}>
                                <InputComponent
                                    keyValue={`min_${mf.form_id}`}
                                    onChange={(_k: string, v: string) =>
                                        handleFormCardinalityChange(mf.form_id, 'min_cardinality', v)
                                    }
                                    value={mf.min_cardinality}
                                    type="number"
                                    label={MESSAGES.min}
                                />
                            </Box>
                            <Box sx={{ width: 100 }}>
                                <InputComponent
                                    keyValue={`max_${mf.form_id}`}
                                    onChange={(_k: string, v: string) =>
                                        handleFormCardinalityChange(mf.form_id, 'max_cardinality', v)
                                    }
                                    value={mf.max_cardinality}
                                    type="number"
                                    label={MESSAGES.max}
                                />
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => handleRemoveForm(mf.form_id)}
                                color="error"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </>
            )}
        </ConfirmCancelDialogComponent>
    );
};
