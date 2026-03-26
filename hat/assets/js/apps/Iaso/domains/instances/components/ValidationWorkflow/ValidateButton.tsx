import React, { FunctionComponent } from 'react';
import { Button, SxProps } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    onClick: () => void;
    id?: string;
    dataTestId?: string;
    sx?: SxProps;
    size?: 'medium' | 'large' | 'small' | undefined;
    variant?: 'text' | 'contained' | 'outlined';
    disabled?: boolean;
    buttonText?: string;
    color?:
        | 'inherit'
        | 'primary'
        | 'secondary'
        | 'success'
        | 'error'
        | 'info'
        | 'warning';
};

export const ValidateButton: FunctionComponent<Props> = ({
    onClick,
    buttonText,
    id = '',
    dataTestId = '',
    sx,
    size = 'medium',
    disabled = false,
    variant = 'contained',
    color = 'primary',
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            sx={sx}
            variant={variant}
            className={classes.button}
            color={color}
            onClick={onClick}
            id={id}
            data-test={dataTestId}
            size={size}
            disabled={disabled}
        >
            {buttonText ?? formatMessage(MESSAGES.validate)}
        </Button>
    );
};
