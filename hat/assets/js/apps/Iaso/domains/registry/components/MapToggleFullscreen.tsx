import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { Box, Paper } from '@mui/material';
import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useEffect,
} from 'react';
import { useMap } from 'react-leaflet';
import { SxStyles } from '../../../types/general';

const styles: SxStyles = {
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
        borderBottom: '1px solid #ccc',
        '&:hover': {
            backgroundColor: '#f4f4f4',
        },
    },
};

type Props = {
    isMapFullScreen: boolean;
    setIsMapFullScreen: Dispatch<SetStateAction<boolean>>;
};

export const MapToggleFullscreen: FunctionComponent<Props> = ({
    isMapFullScreen,
    setIsMapFullScreen,
}) => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [isMapFullScreen, map]);
    return (
        <Paper elevation={1} sx={styles.root}>
            <Box
                onClick={() => setIsMapFullScreen(!isMapFullScreen)}
                sx={styles.box}
            >
                {!isMapFullScreen && <FullscreenIcon fontSize="small" />}
                {isMapFullScreen && <FullscreenExitIcon fontSize="small" />}
            </Box>
        </Paper>
    );
};
