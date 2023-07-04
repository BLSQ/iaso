import React, { FunctionComponent } from 'react';
import { Button, makeStyles } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Settings';
import classnames from 'classnames';
import { useIconLabel } from './hooks';
import { useStyles } from '../Styles';
import { ViewPort } from '../../../constants/types';

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
    zoom: number;
};

export const MapRoundButton: FunctionComponent<MapRoundButton> = ({
    onClick,
    selection,
    zoom,
    disabled = false,
}: MapRoundButton) => {
    const classes = useButtonStyles();
    const styles = useStyles();
    const label = useIconLabel(selection);
    return (
        <Button
            onClick={onClick}
            size="small"
            variant="contained"
            component="button"
            className={classnames(
                classes.blackOnWhite,
                zoom >= 6 && styles.mapLegendCampaigns,
            )}
            disabled={disabled}
        >
            <EditIcon fontSize="small" className={classes.icon} />
            {label}
        </Button>
    );
};
