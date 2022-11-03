import React, { FunctionComponent } from 'react';
import { Button, makeStyles, Box } from '@material-ui/core';
import LoopIcon from '@material-ui/icons/Loop';

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

type AddStepButtonProps = {
    label: string;
    onClick: () => void;
    color: 'red' | 'green' | 'primary';
    disabled?: boolean;
    stepKey: string;
};

export const AddStepButton: FunctionComponent<AddStepButtonProps> = ({
    onClick,
    label,
    stepKey,
    color = 'primary',
    disabled = false,
}: AddStepButtonProps) => {
    const classes = useButtonStyles();
    const usableColor = color ?? 'primary';
    const className =
        usableColor !== 'primary' ? classes[usableColor] : undefined;
    const isRepeat = stepKey.includes('repeat');
    // The div prevents the Button from being too big on small screens
    return (
        <div className={classes.addButton}>
            <Button
                onClick={onClick}
                size="medium"
                variant={isRepeat ? 'outlined' : 'contained'}
                component="button"
                color={usableColor === 'primary' ? usableColor : undefined}
                className={className}
                disabled={disabled}
            >
                {isRepeat && (
                    <LoopIcon fontSize="small" className={classes.repeatIcon} />
                )}

                {label}
            </Button>
        </div>
    );
};
