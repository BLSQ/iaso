// todo : should be in bluesquare-component
import React, { FunctionComponent } from 'react';
import Edit from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import { commonStyles, IntlMessage, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    onClick;
    message?: IntlMessage;
    id?: string;
    dataTestId?: string;
    size?: 'medium' | 'large' | 'small' | undefined;
    variant?: 'text' | 'contained' | 'outlined';
    disabled?: boolean;
    color?:
        | 'inherit'
        | 'primary'
        | 'secondary'
        | 'success'
        | 'error'
        | 'info'
        | 'warning';
};

export const EditButton: FunctionComponent<Props> = ({
    onClick,
    message = MESSAGES.create,
    id = '',
    dataTestId = '',
    size = 'medium',
    disabled = false,
    variant = 'contained',
    color = 'primary',
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant={variant}
            className={classes.button}
            color={color}
            onClick={onClick}
            id={id}
            data-test={dataTestId}
            size={size}
            disabled={disabled}
        >
            <Edit className={classes.buttonIcon} />
            {formatMessage(message)}
        </Button>
    );
};
