import React, { FunctionComponent } from 'react';
import { Button, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
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
        repeatIcon: {
            marginRight: theme.spacing(1),
        },
    };
};

export const useButtonStyles = makeStyles(style);

type OverrideStepButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
};

export const OverrideStepButton: FunctionComponent<OverrideStepButtonProps> = ({
    onClick,
    disabled = false,
}: OverrideStepButtonProps) => {
    const classes = useButtonStyles();
    const theme = useTheme();
    const { formatMessage } = useSafeIntl();

    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    // The div prevents the Button from being too big on small screens
    return (
        <div className={classes.addButton}>
            <Button
                onClick={onClick}
                size={isMobileLayout ? 'small' : 'medium'}
                variant="contained"
                component="button"
                className={classes.red}
                disabled={disabled}
            >
                {formatMessage(MESSAGES.override)}
            </Button>
        </div>
    );
};
