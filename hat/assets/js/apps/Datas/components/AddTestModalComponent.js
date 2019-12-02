
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';


class AddTestModalComponent extends Component {
    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    render() {
        const {
            toggleModal,
            showModale,
            load: {
                loading,
            },
        } = this.props;
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >
                <button
                    className="button"
                    onClick={() => toggleModal()}
                >
                    <i className="fa fa-arrow-left" />
                    <FormattedMessage id="main.label.cancel" defaultMessage="Cancel" />
                </button>
                <button
                    className="button--delete"
                    onClick={() => this.onPermanentDeleteCase()}
                >
                    <i className="fa fa-trash" />
                    <FormattedMessage id="main.label.delete" defaultMessage="Delete" />
                </button>
            </ReactModal>
        );
    }
}

AddTestModalComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    caseItem: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(AddTestModalComponent));
