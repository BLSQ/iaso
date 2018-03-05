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

    render() {
        const videoHtml = `
          <video id="quality-video" class="video-js vjs-default-skin" controls
           preload="auto"
          >
            <source src="${this.props.videoItem.video}" type="video/mp4" />
            <p class="vjs-no-js">
              To view this video please enable JavaScript
            </p>
          </video>
          `;
        return (
            <section className="video-component">
                {/* {
                    !this.state.videoLoaded && <i className="fa fa-spinner" />
                } */}
                <section>
                    <div dangerouslySetInnerHTML={{ __html: videoHtml }} />
                </section>
            </section>
        );
    }
}


VideoComponent.propTypes = {
    videoItem: PropTypes.object.isRequired,
};

export default VideoComponent;
