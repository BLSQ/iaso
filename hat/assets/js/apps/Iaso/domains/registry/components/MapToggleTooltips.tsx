import React, { FunctionComponent, Dispatch, SetStateAction } from 'react';
import { Paper, Box, Tooltip, Switch } from '@mui/material';
import { makeStyles } from '@mui/styles';
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
        borderRadius: 4,
        border: '2px solid rgba(0,0,0,0.2)',
        backgroundColor: 'transparent',
    },
    label: {
        fontSize: 12,
    },
    box: {
        backgroundColor: 'white',
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
        <Paper elevation={0} className={classes.root}>
            <Tooltip arrow title={formatMessage(MESSAGES.showNames)}>
                <Box className={classes.box}>
                    <Switch
                        size="small"
                        checked={showTooltip}
                        onChange={() => setShowTooltip(!showTooltip)}
                        color="primary"
                    />
                </Box>
            </Tooltip>
        </Paper>
    );
};
