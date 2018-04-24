/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import { injectIntl } from 'react-intl';

ReactModal.setAppElement('.container--main');

class AreaModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showAreaModal: props.showAreaModal,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showAreaModal: nextProps.showAreaModal,
        });
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showAreaModal}
                contentLabel="Area assignation modal"
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                Modale content
                <button
                    className="button-close-modal"
                    onClick={() => this.props.toggleModal()}
                >
                    <i className="fa fa-times-circle" />
                </button>
            </ReactModal>
        );
    }
}
AreaModal.defaultProps = {
};
AreaModal.propTypes = {
    showAreaModal: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
};

export default injectIntl(AreaModal);
