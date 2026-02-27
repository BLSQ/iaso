// todo : should be in bluesquare-component
import React, { FunctionComponent } from 'react';
import Delete from '@mui/icons-material/Delete';
import { Button } from '@mui/material';
import { ButtonProps } from '@mui/material/Button/Button';
import { makeStyles } from '@mui/styles';
import { commonStyles, IntlMessage, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    message?: IntlMessage;
    id?: string;
    dataTestId?: string;
} & Omit<ButtonProps, 'children'>;

export const DeleteButton: FunctionComponent<Props> = ({
    message = MESSAGES.delete,
    id = '',
    dataTestId = '',
    size = 'medium',
    disabled = false,
    variant = 'contained',
    color = 'error',
    ...props
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant={variant}
            className={classes.button}
            color={color}
            id={id}
            data-test={dataTestId}
            size={size}
            disabled={disabled}
            {...props}
        >
            <Delete className={classes.buttonIcon} />
            {formatMessage(message)}
        </Button>
    );
};
