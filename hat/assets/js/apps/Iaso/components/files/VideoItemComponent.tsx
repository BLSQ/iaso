import React, { useState, useEffect, useRef, FunctionComponent } from 'react';
import videojs from 'video.js';
import moment from 'moment';
import { IconButton } from '@mui/material';
import PlayIcon from '@mui/icons-material/PlayCircleFilled';
import PauseIcon from '@mui/icons-material/PauseCircleFilled';

import 'video.js/dist/video-js.min.css';
import { ShortFile } from '../../domains/instances/types/instance';
import { getFileName } from '../../utils/filesUtils';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        '&>div': {
            width: '100%',
            height: '30vw',
        },
        '& .video-js .vjs-big-play-button': {
            display: 'none',
        },
        '&:hover>button, &:hover>span': {
            display: 'block',
        },
    },
    playButton: {
        display: 'block',
        top: 'calc(50% - 3rem)',
        left: 'calc(50% - 3rem)',
        position: 'absolute',
    },
    pauseButton: {
        display: 'none',
        top: 'calc(50% - 3rem)',
        left: 'calc(50% - 3rem)',
        position: 'absolute',
    },
    fileInfo: {
        textAlign: 'right',
        display: 'block',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        width: '100%',
        height: 30,
        whiteSpace: 'nowrap',
        top: theme.spacing(1),
        right: theme.spacing(2),
        position: 'absolute',
        color: 'white',
    },
    fileInfoHidden: {
        textAlign: 'right',
        display: 'none',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        width: '100%',
        height: 30,
        whiteSpace: 'nowrap',
        top: theme.spacing(1),
        right: theme.spacing(2),
        position: 'absolute',
        color: 'white',
    },
    icon: {
        fontSize: '6rem',
    },
}));

type Props = {
    videoItem: ShortFile;
};

const VideoItemComponent: FunctionComponent<Props> = ({ videoItem }) => {
    const classes = useStyles();
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
        <section className={classes.root}>
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
                className={
                    !playerPaused ? classes.pauseButton : classes.playButton
                }
                color="secondary"
            >
                {playerPaused ? (
                    <PlayIcon className={classes.icon} />
                ) : (
                    <PauseIcon className={classes.icon} />
                )}
            </IconButton>
            <span
                className={
                    !playerPaused ? classes.fileInfoHidden : classes.fileInfo
                }
            >
                {`${moment.unix(videoItem.createdAt).format('LTS')} - ${
                    fileName.name
                }.${fileName.extension}`}
            </span>
        </section>
    );
};

export default VideoItemComponent;
