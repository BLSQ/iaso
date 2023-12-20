import React, { FunctionComponent } from 'react';
// import { IconButton } from 'bluesquare-components';
import { useSafeIntl } from 'bluesquare-components';
import { Button, useMediaQuery, useTheme, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import LoopIcon from '@mui/icons-material/Loop';

import MESSAGES from '../../../constants/messages';

const style = theme => {
    return {
        addButton: {
            [theme.breakpoints.down('md')]: {
                marginLeft: theme.spacing(1),
            },
        },
        green: {
            backgroundColor: theme.palette.success.main,
            color: 'white',
            '&.MuiButton-contained:hover': {
                backgroundColor: theme.palette.success.main,
            },
        },
        red: {
            backgroundColor: theme.palette.error.main,
            color: 'white',
            '&.MuiButton-contained:hover': {
                backgroundColor: theme.palette.error.main,
            },
        },
        icon: {
            cursor: 'pointer',
        },
    };
};

export const useButtonStyles = makeStyles(style);

type AddStepButtonProps = {
    label: string;
    onClick: () => void;
    color: 'red' | 'green' | 'primary';
    disabled: boolean;
};

export const AddStepButton: FunctionComponent<AddStepButtonProps> = ({
    onClick,
    label,
    color = 'primary',
    disabled = false,
}: AddStepButtonProps) => {
    const classes = useButtonStyles();
    const theme = useTheme();

    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));
    const usableColor = color ?? 'primary';
    const className =
        usableColor !== 'primary' ? classes[usableColor] : undefined;
    // The div prevents the Button from being too big on small screens
    return (
        <div className={classes.addButton}>
            <Button
                onClick={onClick}
                size={isMobileLayout ? 'small' : 'medium'}
                variant="contained"
                component="button"
                color={usableColor === 'primary' ? usableColor : undefined}
                className={className}
                disabled={disabled}
            >
                {label}
            </Button>
        </div>
    );
};

type RepeatStepIconProps = {
    onClick: () => void;
};
export const RepeatStepIcon: FunctionComponent<RepeatStepIconProps> = ({
    onClick,
}: RepeatStepIconProps) => {
    const { formatMessage } = useSafeIntl();
    const classes = useButtonStyles();
    return (
        <Tooltip title={formatMessage(MESSAGES.repeatBudgetStep)}>
            <LoopIcon
                className={classes.icon}
                color="action"
                onClick={onClick}
            />
        </Tooltip>
    );
};
