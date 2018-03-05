import React from 'react';
import PropTypes from 'prop-types';
import VideoComponent from './VideoComponent';
import VideoFormComponent from './VideoFormComponent';


class VideoValidatorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        return (
            <div className="widget__content">
                <div className="quality-label">
                    ID:
                    <span>{this.props.videoItem.id}</span>
                    TYPE:
                    <span>PG / VIDEO</span>
                </div>
                <div className="quality-video-container">
                    <VideoComponent videoItem={this.props.videoItem} />
                    <VideoFormComponent
                        error={this.props.error}
                        submitForm={(test) => {
                            this.props.saveTest({ ...test, test_id: this.props.videoItem.id });
                        }}
                    />
                </div>
            </div>
        );
    }
}

VideoValidatorComponent.defaultProps = {
    error: null,
};

VideoValidatorComponent.propTypes = {
    videoItem: PropTypes.object.isRequired,
    saveTest: PropTypes.func.isRequired,
    error: PropTypes.object,
};

export default VideoValidatorComponent;
