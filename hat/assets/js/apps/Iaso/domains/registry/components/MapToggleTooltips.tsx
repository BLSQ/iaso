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
        top: 'auto',
        right: 'auto',
        left: theme.spacing(1),
        bottom: theme.spacing(4),
        width: 'auto',
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
            <Box p={1}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showTooltip}
                            onChange={() => setShowTooltip(!showTooltip)}
                            color="primary"
                        />
                    }
                    label={formatMessage(MESSAGES.showNames)}
                />
            </Box>
        </Paper>
    );
};
