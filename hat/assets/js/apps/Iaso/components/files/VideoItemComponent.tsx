import React, { useState, useEffect, useRef, FunctionComponent } from 'react';
import videojs from 'video.js';
import moment from 'moment';
import { Box, IconButton } from '@mui/material';
import PlayIcon from '@mui/icons-material/PlayCircleFilled';
import PauseIcon from '@mui/icons-material/PauseCircleFilled';

import 'video.js/dist/video-js.min.css';
import { ShortFile } from '../../domains/instances/types/instance';
import { getFileName } from '../../utils/filesUtils';

const styles = {
    root: {
        position: 'relative',
        '& > div': {
            width: '100%',
            height: '30vw',
        },
        '& .video-js .vjs-big-play-button': {
            display: 'none',
        },
        '&:hover > button, &:hover > span': {
            display: 'block',
        },
    },
    playButton: theme => ({
        display: 'block',
        position: 'absolute',
        top: 'calc(50% - 3rem)',
        left: 'calc(50% - 3rem)',
        color: theme.palette.secondary.main,
        zIndex: 1000,
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
        zIndex: 1000,
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
    videoItem: ShortFile;
};

const VideoItemComponent: FunctionComponent<Props> = ({ videoItem }) => {
    const [playerPaused, setPlayerPaused] = useState(true);
    const playerRef = useRef<videojs.Player | null>(null);
    const videoNodeRef = useRef<HTMLVideoElement | null>(null);
    const fileName = getFileName(videoItem.path);

    useEffect(() => {
        if (!playerRef.current) {
            playerRef.current = videojs(videoNodeRef.current, {}, () => {
                if (playerRef.current) {
                    playerRef.current.src({ src: videoItem.path });
                }
            });
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
            }
        };
    }, [videoItem.path]);

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
            <Box sx={playerPaused ? styles.fileInfo : styles.fileInfoHidden}>
                {`${moment.unix(videoItem.createdAt).format('LTS')} - ${
                    fileName.name
                }.${fileName.extension}`}
            </Box>
        </Box>
    );
};

export default VideoItemComponent;
