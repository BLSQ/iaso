import React from 'react';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DescriptionIcon from '@mui/icons-material/Description';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Box, ButtonBase, FormLabel, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik';
import { FieldInputProps } from 'formik/dist/types';
import { get } from 'lodash';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const styles: SxStyles = {
    root: {
        my: 1,
    },
    label: {
        display: 'block',
        mb: 1.5,
        fontWeight: 600,
        color: 'text.primary',
        fontSize: '0.875rem',
    },
    required: {
        color: 'error.main',
        ml: 0.25,
    },
    group: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        py: 1,
        px: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        color: 'text.primary',
        transition: theme =>
            theme.transitions.create(
                ['background-color', 'border-color', 'color'],
                {
                    duration: theme.transitions.duration.shorter,
                },
            ),
        '&:hover': {
            borderColor: 'primary.main',
        },
    },
    cardSelected: {
        backgroundColor: 'primary.main',
        borderColor: 'primary.main',
        color: 'primary.contrastText',
        '&:hover': {
            backgroundColor: 'primary.dark',
            borderColor: 'primary.dark',
            color: 'primary.contrastText',
        },
    },
    icon: {
        fontSize: 20,
    },
    cardLabel: {
        fontWeight: 700,
        fontSize: '0.75rem',
        textAlign: 'center',
        lineHeight: 1.2,
    },
    error: {
        color: 'error.main',
        fontSize: '0.75rem',
        mt: 1,
    },
};

const MISSION_TYPE_OPTIONS = [
    {
        value: MissionTypeDa2Enum.enum.FORM_FILLING,
        Icon: DescriptionIcon,
        labelMessage: MESSAGES.form,
    },
    {
        value: MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
        Icon: LocationOnIcon,
        labelMessage: MESSAGES.orgUnitAndFormChip,
    },
    {
        value: MissionTypeDa2Enum.enum.ENTITY_AND_FORM,
        Icon: AssignmentIndIcon,
        labelMessage: MESSAGES.entityAndFormChip,
    },
] as const;

type MissionTypeOptionValue = (typeof MISSION_TYPE_OPTIONS)[number]['value'];

export type MissionTypeCardsInputProps<TFieldValue, TValues> = {
    field: FieldInputProps<TFieldValue>;
    form: FormikProps<TValues>;
    label?: string;
    required?: boolean;
    onChange?: (keyValue: string, value: TFieldValue) => void;
};

export const MissionTypeCardsInput = <TFieldValue, TValues>({
    field,
    form,
    label,
    required = false,
    onChange,
}: MissionTypeCardsInputProps<TFieldValue, TValues>) => {
    const { formatMessage } = useSafeIntl();
    const labelText = label ?? formatMessage(MESSAGES.missionType);
    const hasError = Boolean(
        get(form.errors, field.name) && get(form.touched, field.name),
    );
    const error = get(form.errors, field.name);

    const handleSelect = (value: MissionTypeOptionValue) => {
        const nextValue = value as TFieldValue;
        if (onChange) {
            onChange(field.name, nextValue);
        }
        form.setFieldTouched(field.name, true);
        form.setFieldValue(field.name, nextValue);
    };

    return (
        <Box sx={styles.root}>
            <FormLabel
                component="legend"
                id={`${field.name}-label`}
                sx={styles.label}
                error={hasError}
            >
                {labelText}
                {required && (
                    <Box component="span" sx={styles.required}>
                        *
                    </Box>
                )}
            </FormLabel>
            <Box
                role="radiogroup"
                aria-labelledby={`${field.name}-label`}
                sx={styles.group}
            >
                {MISSION_TYPE_OPTIONS.map(({ value, Icon, labelMessage }) => {
                    const optionLabel = formatMessage(labelMessage);
                    const selected = field.value === value;

                    return (
                        <ButtonBase
                            key={value}
                            role="radio"
                            aria-checked={selected}
                            aria-label={optionLabel}
                            onClick={() => handleSelect(value)}
                            sx={
                                [
                                    styles.card,
                                    selected ? styles.cardSelected : null,
                                ] as SxProps<Theme>
                            }
                        >
                            <Icon sx={styles.icon} />
                            <Typography sx={styles.cardLabel}>
                                {optionLabel}
                            </Typography>
                        </ButtonBase>
                    );
                })}
            </Box>
            {hasError && error && (
                <Typography sx={styles.error} role="alert">
                    {String(error)}
                </Typography>
            )}
        </Box>
    );
};
