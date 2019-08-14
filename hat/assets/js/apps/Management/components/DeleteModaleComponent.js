
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';


class DeleteModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
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
                    {` ${this.props.message !== '' ? this.props.message : this.props.element.name}`}
                </div>
                <div className="delete-modal-buttons">
                    <button
                        className="button"
                        onClick={() => this.props.toggleModal()}
                    >
                        <i className="fa fa-arrow-left" />
                        <FormattedMessage id="main.label.cancel" defaultMessage="Cancel" />
                    </button>
                    <button
                        className="button--delete"
                        onClick={() => this.props.deleteElement(this.props.element)}
                    >
                        <i className="fa fa-trash" />
                        <FormattedMessage id="main.label.delete" defaultMessage="Delete" />
                    </button>
                </div>
            </ReactModal>
        );
    }
}

DeleteModale.defaultProps = {
    message: '',
};

DeleteModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    deleteElement: PropTypes.func.isRequired,
    element: PropTypes.object.isRequired,
    message: PropTypes.string,
};

export default injectIntl(DeleteModale);
