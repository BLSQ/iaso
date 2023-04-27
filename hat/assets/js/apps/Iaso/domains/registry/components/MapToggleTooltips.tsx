import React, { FunctionComponent, Dispatch, SetStateAction } from 'react';
import {
    Paper,
    makeStyles,
    Box,
    FormControlLabel,
    Switch,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
        bottom: 'auto',
        right: 'auto',
        left: theme.spacing(6),
        top: 10,
        width: 'auto',
    },
    label: {
        fontSize: 12,
    },
}));

type Props = {
    showTooltip: boolean;
    setShowTooltip: Dispatch<SetStateAction<boolean>>;
};

export const MapToggleTooltips: FunctionComponent<Props> = ({
    showTooltip,
    setShowTooltip,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box pl={2}>
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={showTooltip}
                            onChange={() => setShowTooltip(!showTooltip)}
                            color="primary"
                        />
                    }
                    label={
                        <span className={classes.label}>
                            {formatMessage(MESSAGES.showNames)}
                        </span>
                    }
                />
            </Box>
        </Paper>
    );
};
