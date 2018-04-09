
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';

ReactModal.setAppElement('.container--main');


class DeleteModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
        });
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <div>
                    <FormattedMessage id="main.management.eraseMsg" defaultMessage="Confirmer la suppression de" />
                    {` ${this.props.element.name}`}
                </div>
                <div className="delete-modal-buttons">
                    <button
                        className="button"
                        onClick={() => this.props.toggleModal()}
                    >
                        <i className="fa fa-arrow-left" />
                        <FormattedMessage id="main.label.cancel" defaultMessage="Annuler" />
                    </button>
                    <button
                        className="button--delete"
                        onClick={() => this.props.deleteElement(this.props.element)}
                    >
                        <i className="fa fa-trash" />
                        <FormattedMessage id="main.label.delete" defaultMessage="Effacer" />
                    </button>
                </div>
            </ReactModal>
        );
    }
}

DeleteModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    deleteElement: PropTypes.func.isRequired,
    element: PropTypes.object.isRequired,
};

export default injectIntl(DeleteModale);
