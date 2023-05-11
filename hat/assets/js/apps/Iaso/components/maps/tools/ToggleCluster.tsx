import React, { FunctionComponent, Dispatch, SetStateAction } from 'react';
import { Paper, makeStyles, Switch, Tooltip, Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
        bottom: 'auto',
        left: 'auto',
        right: theme.spacing(5),
        top: theme.spacing(1),
        width: 'auto',
        borderRadius: 4,
        border: '2px solid rgba(0,0,0,0.2)',
    },
    label: {
        fontSize: 12,
    },
}));

type Props = {
    isClusterActive: boolean;
    setIsClusterActive: Dispatch<SetStateAction<boolean>>;
};

export const ToggleCluster: FunctionComponent<Props> = ({
    isClusterActive,
    setIsClusterActive,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={0} className={classes.root}>
            <Tooltip arrow title={formatMessage(MESSAGES.title)}>
                <Box>
                    <Switch
                        size="small"
                        checked={isClusterActive}
                        onChange={() => setIsClusterActive(!isClusterActive)}
                        color="primary"
                    />
                </Box>
            </Tooltip>
        </Paper>
    );
};
