import React from 'react';
import { Box, ButtonBase, FormLabel, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik';
import { FieldInputProps } from 'formik/dist/types';
import { get } from 'lodash';
import { SxStyles } from 'Iaso/types/general';
import { MISSION_TYPE_OPTIONS } from '../constants';
import MESSAGES from '../messages';
import { missionStyles } from './styles';

const styles: SxStyles = {
    root: missionStyles.fieldRoot,
    label: missionStyles.fieldLabel,
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
        alignItems: 'start',
        justifyContent: 'flex-start',
        gap: 0.5,
        py: 2,
        px: 2,
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
        mr: 0.5,
    },
    cardLabel: {
        display: 'inline-flex',
        verticalAlign: 'text-bottom',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '0.8125rem',
        mb: 0.5,
    },
    error: {
        color: 'error.main',
        fontSize: '0.75rem',
        mt: 1,
    },
};

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
                {MISSION_TYPE_OPTIONS.map(
                    ({ value, Icon, labelMessage, descriptionMessage }) => {
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
                                <Typography sx={styles.cardLabel}>
                                    <Icon sx={styles.icon} />
                                    {optionLabel}
                                </Typography>
                                <Typography variant="caption" textAlign="left">
                                    {formatMessage(descriptionMessage)}
                                </Typography>
                            </ButtonBase>
                        );
                    },
                )}
            </Box>
            {hasError && error && (
                <Typography sx={styles.error} role="alert">
                    {String(error)}
                </Typography>
            )}
        </Box>
    );
};
