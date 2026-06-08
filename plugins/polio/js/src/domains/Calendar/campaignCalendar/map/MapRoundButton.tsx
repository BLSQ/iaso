import React, { FunctionComponent } from 'react';
import EditIcon from '@mui/icons-material/Settings';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classnames from 'classnames';
import { useStyles } from '../Styles';
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
