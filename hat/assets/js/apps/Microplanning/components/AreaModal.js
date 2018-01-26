/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component, PropTypes } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { createUrl } from '../../../utils/fetchData';
import Select from 'react-select';
import ReactModal from 'react-modal';

ReactModal.setAppElement('.container--main');

const MESSAGES = defineMessages({
    'all': {
        defaultMessage: 'Toutes',
        id: 'microplanning.all'
    }
})

class AreaModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showAreaModal: props.showAreaModal
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showAreaModal: nextProps.showAreaModal
        });
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showAreaModal}
                contentLabel="Area assignation modal"
                shouldCloseOnOverlayClick={true}
                onRequestClose={() => this.props.toggleModal()}
            >
                Modale content
                <button
                    className="button-close-modal"
                    onClick={() => this.props.toggleModal()}
                >
                    <i className='fa fa-times-circle' />
                </button>
            </ReactModal>
        )
    }
}
AreaModal.defaultProps = {
};
AreaModal.propTypes = {
    showAreaModal: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired
}

export default injectIntl(AreaModal);
