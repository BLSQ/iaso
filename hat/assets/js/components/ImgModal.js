import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import ReactDOM from 'react-dom';
import ReactResizeDetector from 'react-resize-detector';
import { FormattedMessage } from 'react-intl';

const getImgProps = (imageObj, maxWidth, maxHeight) => {
    let newWidth = maxWidth;
    let newHeight = maxHeight;
    const orientation = imageObj.height > imageObj.width ? 'portrait' : 'landscape';
    const tempHeight = imageObj.height / (imageObj.width / maxWidth);
    if ((imageObj.height > imageObj.width) || (tempHeight > maxHeight)) {
        newWidth = imageObj.width / (imageObj.height / maxHeight);
        newHeight = maxHeight;
    } else {
        newHeight = tempHeight;
        newWidth = maxWidth;
    }
    return {
        width: newWidth,
        height: newHeight,
        orientation,
    };
};


const modalStyle = {
    content: {
        maxWidth: 'calc(90% + 40px)',
        maxHeight: 'calc(90% + 40px)',
        inset: '0',
        padding: '20px',
        backgroundColor: 'white',
        outline: 'none',
        borderRadius: '5px',
    },
    overlay: {
        alignItems: 'center',
    },
};


class ImgModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            imgProps: {
                width: 0,
                height: 0,
                orientation: '',
            },
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentDidMount() {
        this.onResize();
    }

    onResize() {
        const newImg = new Image();
        const windowWidth = document.documentElement.clientWidth;
        const windowHeight = document.documentElement.clientHeight;
        ReactDOM.unmountComponentAtNode(newImg);
        newImg.onload = () => {
            this.setState({
                imgProps: getImgProps(newImg, windowWidth * 0.9, (windowHeight * 0.9) - 60),
            });
        };
        newImg.src = this.props.imgPath;
    }


    toggleModal() {
        this.setState({
            showModal: !this.state.showModal,
        });
    }

    render() {
        const {
            imgPath,
            altText,
        } = this.props;
        const {
            showModal,
            imgProps,
        } = this.state;
        const imgStyle = {
            width: imgProps.width,
            height: imgProps.height,
        };
        if (showModal) {
            return (
                <ReactResizeDetector handleWidth handleHeight onResize={() => this.onResize()}>
                    <ReactModal
                        isOpen
                        shouldCloseOnOverlayClick
                        onRequestClose={() => this.toggleModal()}
                        style={modalStyle}
                        className="img-modal"
                    >
                        <img
                            src={imgPath}
                            alt={altText || imgPath}
                            style={imgStyle}
                            className={imgProps.orientation}
                        />

                        <div className="align-right">
                            <button
                                className="button margin-top"
                                onClick={() => this.toggleModal()}
                            >
                                <i className="fa fa-arrow-left" />
                                <FormattedMessage id="main.label.close" defaultMessage="fermer" />
                            </button>
                        </div>
                    </ReactModal>
                </ReactResizeDetector>
            );
        }
        const style = {
            width: imgProps.orientation === 'landscape' ? '100%' : 'auto',
            height: imgProps.orientation === 'portrait' ? '100%' : 'auto',
            maxHeight: '400px',
            cursor: 'pointer',
        };

        if (this.props.smallPreview) {
            style.maxHeight = '100px';
        }

        return (
            <img
                src={imgPath}
                alt={altText || imgPath}
                className={imgProps.orientation}
                onClick={() => this.toggleModal()}
                style={style}
            />
        );
    }
}

ImgModal.defaultProps = {
    altText: null,
    smallPreview: false,
};

ImgModal.propTypes = {
    imgPath: PropTypes.string.isRequired,
    altText: PropTypes.string,
    smallPreview: PropTypes.bool,
};

export default ImgModal;
