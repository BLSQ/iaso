import React, { useState, useEffect, useRef, FunctionComponent } from 'react';
import PauseIcon from '@mui/icons-material/PauseCircleFilled';
import PlayIcon from '@mui/icons-material/PlayCircleFilled';
import { Box, IconButton } from '@mui/material';
import moment from 'moment';
import videojs from 'video.js';

import 'video.js/dist/video-js.min.css';
import { getFileName } from '../../utils/filesUtils';

const styles = {
    root: {
        position: 'relative',
        height: '100%',
        '& > div': {
            width: '100%',
            height: '100%',
        },
        '& .video-js .vjs-big-play-button': {
            display: 'none',
        },
        '&:hover > button, &:hover > span': {
            display: 'block',
        },
        '& .video-js .vjs-tech': {
            position: 'relative',
            top: 'auto',
            left: 'auto',
        },
    },
    playButton: theme => ({
        display: 'block',
        position: 'absolute',
        top: 'calc(50% - 3rem)',
        left: 'calc(50% - 3rem)',
        color: theme.palette.secondary.main,
        zIndex: 1,
        backgroundColor: 'white !important',
        width: 80,
        height: 80,
    }),
    pauseButton: theme => ({
        display: 'none',
        position: 'absolute',
        top: 'calc(50% - 3rem)',
        left: 'calc(50% - 3rem)',
        color: theme.palette.secondary.main,
        zIndex: 1,
        backgroundColor: 'white !important',
        width: 80,
        height: 80,
    }),
    icon: theme => ({
        fontSize: '6rem',
        position: 'absolute',
        top: theme.spacing(-1),
        left: theme.spacing(-1),
    }),
    fileInfo: theme => ({
        textAlign: 'right',
        display: 'block',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        width: '100%',
        height: 30,
        whiteSpace: 'nowrap',
        position: 'absolute',
        color: 'white',
        top: theme.spacing(1),
        right: theme.spacing(2),
    }),
    fileInfoHidden: theme => ({
        display: 'none',
        textAlign: 'right',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        width: '100%',
        height: 30,
        whiteSpace: 'nowrap',
        position: 'absolute',
        color: 'white',
        top: theme.spacing(1),
        right: theme.spacing(2),
    }),
};

type Props = {
    videoPath: string;
    fileInfo?: string;
};

const VideoItemComponent: FunctionComponent<Props> = ({
    videoPath,
    fileInfo,
}) => {
    const [playerPaused, setPlayerPaused] = useState(true);
    const playerRef = useRef<videojs.Player | null>(null);
    const videoNodeRef = useRef<HTMLVideoElement | null>(null);
    const fileName = getFileName(videoPath);

    useEffect(() => {
        if (!playerRef.current) {
            playerRef.current = videojs(videoNodeRef.current, {}, () => {
                if (playerRef.current) {
                    playerRef.current.src({ src: videoPath });
                }
            });
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
            }
        };
    }, [videoPath]);

    const togglePlayback = () => {
        if (playerRef.current) {
            if (playerRef.current.paused()) {
                playerRef.current.play();
                setPlayerPaused(false);
            } else {
                playerRef.current.pause();
                setPlayerPaused(true);
            }
        }
    };

    return (
        <Box sx={styles.root}>
            <div data-vjs-player>
                <video
                    ref={videoNodeRef}
                    className="video-js vjs-default-skin"
                    controls
                    preload="auto"
                >
                    <track kind="captions" />
                </video>
            </div>
            <IconButton
                onClick={togglePlayback}
                sx={playerPaused ? styles.playButton : styles.pauseButton}
            >
                {playerPaused ? (
                    <PlayIcon sx={styles.icon} />
                ) : (
                    <PauseIcon sx={styles.icon} />
                )}
            </IconButton>
            {fileInfo && (
                <Box
                    sx={playerPaused ? styles.fileInfo : styles.fileInfoHidden}
                >
                    {fileInfo}
                </Box>
            )}
        </Box>
    );
};

export default VideoItemComponent;
