import React from 'react';
import PropTypes from 'prop-types';
import VideoComponent from '../../../components/VideoComponent';
import VideoFormComponent from './VideoFormComponent';


class VideoValidatorComponent extends React.Component {
    render() {
        return (
            <div className="widget__content">
                <div className="quality-video-container">
                    <VideoComponent videoItem={this.props.currentTest} />
                    <VideoFormComponent
                        error={this.props.error}
                        submitForm={(test) => {
                            this.props.saveTest({
                                test_id: this.props.currentTest.id,
                                comment: test.comment,
                                is_clear: test.isClear,
                                is_good_place: test.isGoodPlace,
                                is_confirmed_case: test.isConfirmedCase,
                                has_other_parasite: test.hasOtherParasite,
                            });
                        }}
                        userLevel={this.props.userLevel}
                        currentTest={this.props.currentTest}
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
    userLevel: PropTypes.number.isRequired,
};

export default VideoValidatorComponent;
