import React from 'react';
import PropTypes from 'prop-types';
import videojs from 'video.js';

class VideoComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            player: null,
        };
    }

    componentDidMount() {
        if (!this.state.player) {
            // eslint-disable-next-line react/no-did-mount-set-state
            this.setState({
                player: videojs('quality-video'),
            });
        }
    }

    componentWillUnmount() {
        if (this.state.player) {
            this.state.player.dispose();
        }
    }

    renderVideoHtml() {
        return (`
        <video
            id="quality-video"
            class="video-js vjs-default-skin"
            controls
            preload="auto"
        >
          <source src="${this.props.videoItem.video}" type="video/mp4" />
        </video>
        `);
    }

    render() {
        return (
            <section className="video-component">
                <section>
                    {/* eslint-disable-next-line react/no-danger */}
                    <div dangerouslySetInnerHTML={{ __html: this.renderVideoHtml() }} />
                </section>
            </section>
        );
    }
}


VideoComponent.propTypes = {
    videoItem: PropTypes.object.isRequired,
};

export default VideoComponent;
