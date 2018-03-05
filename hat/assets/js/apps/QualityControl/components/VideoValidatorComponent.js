import React from 'react';
import PropTypes from 'prop-types';
import VideoComponent from './VideoComponent';


class VideoValidatorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        return (
            <div className="widget__content image-validator-container">
                <div className="quality-label">
                    ID:
                    <span>{this.props.videoItem.id}</span>
                    TYPE:
                    <span>PG / VIDEO</span>
                </div>
                <VideoComponent videoItem={this.props.videoItem} />
                {/* <ImageFormComponent
                    submitForm={(test) => {
                        this.props.saveTest({ ...test, test_id: this.props.videoItem.id });
                    }}
                /> */}
            </div>
        );
    }
}


VideoValidatorComponent.propTypes = {
    videoItem: PropTypes.object.isRequired,
    saveTest: PropTypes.func.isRequired,
};

export default VideoValidatorComponent;
