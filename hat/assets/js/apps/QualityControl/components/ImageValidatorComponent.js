import React from 'react';
import PropTypes from 'prop-types';
import ImageComponent from './ImageComponent';
import ImageFormComponent from './ImageFormComponent';

class ImageValidatorComponent extends React.Component {
    render() {
        return (
            <div className="widget__content">
                <div className="quality-label">
                    TYPE:
                    <span>{this.props.currentTest.type}</span>
                </div>
                <ImageComponent imageItem={this.props.currentTest} />
                <ImageFormComponent
                    currentTest={this.props.currentTest}
                    error={this.props.error}
                    submitForm={(test, comment) => {
                        this.props.saveTest(test, comment);
                    }}
                    userLevel={this.props.userLevel}
                />
            </div>
        );
    }
}

ImageValidatorComponent.defaultProps = {
    error: null,
};

ImageValidatorComponent.propTypes = {
    currentTest: PropTypes.object.isRequired,
    saveTest: PropTypes.func.isRequired,
    error: PropTypes.object,
    userLevel: PropTypes.number.isRequired,
};

export default ImageValidatorComponent;
