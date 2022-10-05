import React, { FunctionComponent } from 'react';
import { Button, makeStyles } from '@material-ui/core';

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
    };
};

export const useButtonStyles = makeStyles(style);

type AddStepButtonProps = {
    label: string;
    onClick: () => void;
    color: 'red' | 'green' | 'primary';
    disabled?: boolean;
};

export const AddStepButton: FunctionComponent<AddStepButtonProps> = ({
    onClick,
    label,
    color = 'primary',
    disabled = false,
}: AddStepButtonProps) => {
    const classes = useButtonStyles();
    const className = color !== 'primary' ? classes[color] : undefined;
    // The div prevents the Button from being too big on small screens
    return (
        <div className={classes.addButton}>
            <Button
                onClick={onClick}
                size="medium"
                variant="contained"
                component="button"
                color={color === 'primary' ? color : undefined}
                className={className}
                disabled={disabled}
            >
                {label}
            </Button>
        </div>
    );
};
