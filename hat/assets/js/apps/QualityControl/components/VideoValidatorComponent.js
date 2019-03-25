import React from 'react';
import PropTypes from 'prop-types';
import VideoComponent from '../../../components/VideoComponent';
import VideoFormComponent from './VideoFormComponent';


class VideoValidatorComponent extends React.Component {
    render() {
        return (
            <div className="widget__content">
                <div className="quality-label">
                    ID:
                    <span>{this.props.currentTest.id}</span>
                    TYPE:
                    <span>{this.props.currentTest.type}</span>
                </div>
                <div className="quality-video-container">
                    <VideoComponent videoItem={this.props.currentTest} />
                    <VideoFormComponent
                        error={this.props.error}
                        submitForm={(test) => {
                            this.props.saveTest({ ...test, test_id: this.props.currentTest.id });
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
    currentTest: PropTypes.object.isRequired,
    saveTest: PropTypes.func.isRequired,
    error: PropTypes.object,
};

export default VideoValidatorComponent;
