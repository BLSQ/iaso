import React from 'react';
import { Button, ButtonPropsSizeOverrides } from '@mui/material';
import {
    ButtonProps,
    ButtonPropsVariantOverrides,
} from '@mui/material/Button/Button';
import { makeStyles } from '@mui/styles';
import { OverridableStringUnion } from '@mui/types';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = Omit<ButtonProps, 'children' | 'size' | 'variant'> & {
    size?: OverridableStringUnion<
        'small' | 'medium' | 'large',
        ButtonPropsSizeOverrides
    >;
    variant?: OverridableStringUnion<
        'text' | 'outlined' | 'contained',
        ButtonPropsVariantOverrides
    >;
    buttonText?: string;
};

export const ValidateButton = ({
    buttonText,
    size = 'small',
    variant = 'contained',
    ...props
}: Props) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant={variant}
            className={classes.button}
            size={size}
            {...props}
        >
            {buttonText ?? formatMessage(MESSAGES.validate)}
        </Button>
    );
};
