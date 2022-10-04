import React, { FunctionComponent } from 'react';
import { Button, makeStyles } from '@material-ui/core';

const style = theme => {
    return {
        addButton: {
            [theme.breakpoints.down('md')]: {
                marginLeft: theme.spacing(1),
            },
        },
    };
};

export const useButtonStyles = makeStyles(style);

type AddStepButtonProps = {
    label: string;
    onClick: () => void;
};

export const AddStepButton: FunctionComponent<AddStepButtonProps> = ({
    onClick,
    label,
}: AddStepButtonProps) => {
    const classes = useButtonStyles();
    // The div prevents the Button from being too big on small screens
    return (
        <div className={classes.addButton}>
            <Button
                onClick={onClick}
                size="medium"
                variant="contained"
                component="button"
            >
                {label}
            </Button>
        </div>
    );
};
