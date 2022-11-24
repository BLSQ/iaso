import React, { FunctionComponent } from 'react';
import { Button, makeStyles } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useIconLabel } from './hooks';

const style = theme => {
    return {
        icon: {
            marginRight: theme.spacing(1),
        },
        blackOnWhite: {
            backgroundColor: 'white',
            color: 'black',
            '&.MuiButton-contained:hover': {
                backgroundColor: 'white',
            },
        },
    };
};

export const useButtonStyles = makeStyles(style);

type MapRoundButton = {
    onClick: () => void;
    disabled?: boolean;
    selection: string;
};

export const MapRoundButton: FunctionComponent<MapRoundButton> = ({
    onClick,
    selection,
    disabled = false,
}: MapRoundButton) => {
    const classes = useButtonStyles();
    const label = useIconLabel(selection);
    return (
        <Button
            onClick={onClick}
            size="small"
            variant="contained"
            component="button"
            className={classes.blackOnWhite}
            disabled={disabled}
        >
            <EditIcon fontSize="small" className={classes.icon} />
            {label}
        </Button>
    );
};
