import React, { FunctionComponent, Dispatch, SetStateAction } from 'react';
import { Paper, makeStyles, Box } from '@material-ui/core';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';

const useStyles = makeStyles(() => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 1100,
        bottom: 'auto',
        right: 'auto',
        left: 10,
        top: 132,
        padding: 0,
        borderRadius: 0,
        boxShadow: 'none',
        height: 34,
        width: 34,
        borderLeft: '2px solid rgba(0,0,0,0.2)',
        borderRight: '2px solid rgba(0,0,0,0.2)',
        borderBottom: '2px solid rgba(0,0,0,0.2)',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        backgroundColor: 'transparent',
    },
    box: {
        borderTop: '1px solid rgba(0,0,0,0.2)',
        backgroundColor: 'white',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        '&:hover': {
            backgroundColor: '#f4f4f4',
        },
    },
}));

type Props = {
    isMapFullScreen: boolean;
    setIsMapFullScreen: Dispatch<SetStateAction<boolean>>;
};

export const MapToggleFullscreen: FunctionComponent<Props> = ({
    isMapFullScreen,
    setIsMapFullScreen,
}) => {
    const classes = useStyles();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box
                onClick={() => setIsMapFullScreen(!isMapFullScreen)}
                className={classes.box}
            >
                {!isMapFullScreen && <FullscreenIcon fontSize="small" />}
                {isMapFullScreen && <FullscreenExitIcon fontSize="small" />}
            </Box>
        </Paper>
    );
};
