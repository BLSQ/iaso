import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import ReactDOM from 'react-dom';

import getImgProps from '../utils/images';

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
        const domImg = document.querySelector(`img[src='${this.props.imgPath}']`);
        const windowWidth = document.documentElement.clientWidth;
        const windowHeight = document.documentElement.clientHeight;
        ReactDOM.unmountComponentAtNode(domImg);
        domImg.onload = () => {
            this.setState({
                imgProps: getImgProps(domImg, windowWidth * 0.9, windowHeight * 0.9),
            });
        };
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
                </ReactModal>
            );
        }
        return (
            <img
                src={imgPath}
                alt={altText || imgPath}
                onClick={() => this.toggleModal()}
                style={{
                    width: imgProps.orientation === 'landscape' ? '100%' : 'auto',
                    height: imgProps.orientation === 'portrait' ? '100%' : 'auto',
                    maxHeight: '400px',
                    cursor: 'pointer',
                }}
            />
        );
    }
}

ImgModal.defaultProps = {
    altText: null,
};

ImgModal.propTypes = {
    imgPath: PropTypes.string.isRequired,
    altText: PropTypes.string,
};

export default ImgModal;
