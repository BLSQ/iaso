import React from 'react';
import PropTypes from 'prop-types';
import ImageComponent from './ImageComponent';
import ImageFormComponent from './ImageFormComponent';

class ImageValidatorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        return (
            <div className="widget__content">
                <div className="quality-label">
                    TYPE:
                    <span>{this.props.type}</span>
                </div>
                <ImageComponent imageItem={this.props.imageItems[0]} />
                <ImageFormComponent
                    imageItems={this.props.imageItems}
                    error={this.props.error}
                    submitForm={(imageItems) => {
                        this.props.saveTest(imageItems);
                    }}
                />
            </div>
        );
    }
}

ImageValidatorComponent.defaultProps = {
    error: null,
};

ImageValidatorComponent.propTypes = {
    imageItems: PropTypes.array.isRequired,
    saveTest: PropTypes.func.isRequired,
    type: PropTypes.string.isRequired,
    error: PropTypes.object,
};

export default ImageValidatorComponent;
