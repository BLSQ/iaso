import React, { ElementType, FC, useCallback } from 'react';
import {
    FormControl,
    FormHelperText,
    FormLabel,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

export type ToggleButtonOption = {
    label: string;
    value: string;
    icon?: ElementType;
};

type Props = {
    keyValue: string;
    value?: string;
    onChange: (keyValue: string, value: string) => void;
    options: ToggleButtonOption[];
    label?: string;
    errors?: string[];
    required?: boolean;
    size?: 'small' | 'medium' | 'large';
};

const styles = {
    control: { mt: 2 },
    label: { fontSize: 12, mb: 1 },
    group: { width: 'fit-content' },
    button: { gap: 0.75, textTransform: 'none' },
} satisfies SxStyles;

export const ToggleButtonGroupInput: FC<Props> = ({
    keyValue,
    value,
    onChange,
    options,
    label,
    errors = [],
    required = false,
    size = 'medium',
}) => {
    const handleChange = useCallback(
        (_event: React.MouseEvent, newValue: string | null) => {
            if (newValue !== null) {
                onChange(keyValue, newValue);
            }
        },
        [keyValue, onChange],
    );

    return (
        <FormControl fullWidth error={errors.length > 0} sx={styles.control}>
            {label && (
                <FormLabel sx={styles.label}>
                    {`${label}${required ? '*' : ''}`}
                </FormLabel>
            )}
            <ToggleButtonGroup
                size={size}
                exclusive
                color="primary"
                value={value}
                onChange={handleChange}
                sx={styles.group}
            >
                {options.map(({ icon: Icon, ...option }) => (
                    <ToggleButton
                        key={option.value}
                        value={option.value}
                        sx={styles.button}
                    >
                        {Icon && <Icon fontSize="small" />}
                        {option.label}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
            {errors.map(error => (
                <FormHelperText key={error}>{error}</FormHelperText>
            ))}
        </FormControl>
    );
};
