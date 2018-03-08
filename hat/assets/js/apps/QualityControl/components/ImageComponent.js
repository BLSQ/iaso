import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

const maxValue = 800;

const initiaState = {
    imgLoaded: false,
    imgSize: {
        width: 0,
        height: 0,
        orientation: 'landscape',
    },
    rotation: 0,
};

class ImageComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = initiaState;
    }


    componentWillReceiveProps(nextProps) {
        if (nextProps.imageItem.id !== this.props.imageItem.id) {
            this.setState(initiaState);
            ReactDOM.unmountComponentAtNode(document.getElementById(`img-${this.props.imageItem.id}`));
            const img = new Image();
            img.onload = () => {
                this.onImgLoaded(document.getElementById(`img-${nextProps.imageItem.id}`));
            };
            img.src = nextProps.imageItem.image;
        }
    }

    onImgLoaded(imageObj) {
        let newWidth = maxValue;
        let newHeight = maxValue;
        let orientation = 'landscape';
        if (imageObj.height > imageObj.width) {
            orientation = 'portrait';
            newWidth = imageObj.width / (imageObj.height / maxValue);
            newHeight = maxValue;
        } else {
            newHeight = imageObj.height / (imageObj.width / maxValue);
            newWidth = maxValue;
        }
        this.setState({
            imgLoaded: true,
            imgSize: {
                width: newWidth,
                height: newHeight,
                orientation,
            },
        });
    }

    getStyles() {
        const newStyles = {
            height: this.state.imgSize.height,
            top: 0,
        };
        if ((Math.abs(this.state.rotation) === 90) ||
            (Math.abs(this.state.rotation) === 270)) {
            newStyles.height = this.state.imgSize.width;
            if (this.state.imgSize.orientation === 'portrait') {
                newStyles.top = -((this.state.imgSize.height / 2) -
                    (this.state.imgSize.width / 2));
            } else {
                newStyles.top = ((this.state.imgSize.width / 2) -
                    (this.state.imgSize.height / 2));
            }
        }
        return newStyles;
    }

    rotate(orientation) {
        let newAngle = orientation ? this.state.rotation + 90 : this.state.rotation - 90;
        if (Math.abs(newAngle) === 360) {
            newAngle = 0;
        }
        this.setState({
            rotation: newAngle,
        });
    }

    render() {
        const imageClassName = !this.state.imgLoaded ?
            'hidden' :
            `${this.state.imgSize.orientation} rotate-${this.state.rotation < 0 ?
                'right' :
                'left'}-${Math.abs(this.state.rotation)}`;

        return (
            <section className="image-component">
                <div className="rotate-container">
                    <button
                        className="button--small"
                        onClick={() => this.rotate(true)}
                    >
                        <i className="fa fa-repeat" />
                    </button>
                    <button
                        className="button--small"
                        onClick={() => this.rotate(false)}
                    >
                        <i className="fa fa-undo" />
                    </button>
                </div>
                {
                    !this.state.imgLoaded && <i className="fa fa-spinner" />
                }
                <section style={{ height: `${this.getStyles().height}px` }} >
                    <img
                        src={this.props.imageItem.image}
                        style={{ top: `${this.getStyles().top}px` }}
                        alt={`img-${this.props.imageItem.id}`}
                        id={`img-${this.props.imageItem.id}`}
                        onLoad={event => this.onImgLoaded(event.currentTarget)}
                        className={imageClassName}
                    />
                </section>
            </section>
        );
    }
}


ImageComponent.propTypes = {
    imageItem: PropTypes.object.isRequired,
};

export default ImageComponent;
