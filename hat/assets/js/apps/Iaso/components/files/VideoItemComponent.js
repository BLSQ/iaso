import React from 'react';
import PropTypes from 'prop-types';
import videojs from 'video.js';
import moment from 'moment';
import { IconButton } from '@mui/material';
import { withStyles } from '@mui/styles';
import PlayIcon from '@mui/icons-material/PlayCircleFilled';
import PauseIcon from '@mui/icons-material/PauseCircleFilled';
import { theme } from 'bluesquare-components';

import 'video.js/dist/video-js.min.css';

const styles = () => ({
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
});

class VideoItemComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            playerPaused: true,
        };
    }

    componentDidMount() {
        if (!this.player) {
            this.player = videojs(this.videoNode, this.props, () => {
                this.player.src({
                    src: this.props.videoItem.path,
                });
            });
        }
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    togglePlayback() {
        if (this.player.paused()) {
            this.player.play();
            this.setState({
                playerPaused: false,
            });
        } else {
            this.player.pause();
            this.setState({
                playerPaused: true,
            });
        }
    }

    render() {
        const { classes, videoItem } = this.props;
        const { playerPaused } = this.state;
        return (
            <section className={classes.root}>
                <div data-vjs-player>
                    <video
                        ref={node => {
                            this.videoNode = node;
                        }}
                        className="video-js vjs-default-skin"
                        controls
                        preload="auto"
                    >
                        <track kind="captions" />
                    </video>
                </div>
                <IconButton
                    onClick={() => this.togglePlayback()}
                    className={
                        !playerPaused ? classes.pauseButton : classes.playButton
                    }
                    color="secondary"
                >
                    {playerPaused && <PlayIcon className={classes.icon} />}
                    {!playerPaused && <PauseIcon className={classes.icon} />}
                </IconButton>
                <span
                    className={
                        !playerPaused
                            ? classes.fileInfoHidden
                            : classes.fileInfo
                    }
                >
                    {`${moment.unix(videoItem.createdAt).format('LTS')} - ${
                        videoItem.name
                    }.${videoItem.extension}`}
                </span>
            </section>
        );
    }
}

VideoItemComponent.propTypes = {
    videoItem: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(VideoItemComponent);
