import React from 'react';
import PropTypes from 'prop-types';
import videojs from 'video.js';

class VideoComponent extends React.Component {
    componentDidMount() {
        if (!this.player) {
            this.player = videojs(this.videoNode, this.props, () => {
                this.player.src({
                    src: this.props.videoItem.video,
                });
            });
        }
    }

    componentWillReceiveProps(newProps) {
        if (this.player) {
            this.player.src({
                src: newProps.videoItem.video,
            });
        }
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    render() {
        return (
            <section className="video-component">
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
            </section>
        );
    }
}

VideoComponent.propTypes = {
    videoItem: PropTypes.object.isRequired,
};

export default VideoComponent;
