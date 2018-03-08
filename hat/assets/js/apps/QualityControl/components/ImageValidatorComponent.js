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
                    ID:
                    <span>{this.props.imageItem.id}</span>
                    TYPE:
                    <span>{this.props.type}</span>
                </div>
                <ImageComponent imageItem={this.props.imageItem} />
                <ImageFormComponent
                    imageItem={this.props.imageItem}
                    error={this.props.error}
                    submitForm={(test) => {
                        this.props.saveTest({ ...test, test_id: this.props.imageItem.id });
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
    imageItem: PropTypes.object.isRequired,
    saveTest: PropTypes.func.isRequired,
    type: PropTypes.string.isRequired,
    error: PropTypes.object,
};

export default ImageValidatorComponent;
