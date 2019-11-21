
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';
import Warning from '@material-ui/icons/Warning';
import Check from '@material-ui/icons/Check';

import { casesActions } from '../redux/cases';


class DeleteCaseModalComponent extends Component {
    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    onPermanentDeleteCase() {
        const {
            caseItem,
            onDeleteCase,
        } = this.props;
        onDeleteCase(caseItem);
    }

    onCloseModal() {
        const {
            setCaseDeleted,
            dispatch,
            toggleModal,
        } = this.props;
        dispatch(setCaseDeleted(null));
        toggleModal();
    }

    render() {
        const {
            toggleModal,
            showModale,
            deleteResult,
            deleteError,
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
                {
                    (!deleteResult || (deleteResult && loading))
                    && !deleteError
                    && (
                        <Fragment>
                            <div className="widget__header">
                                <h2>
                                    <FormattedMessage id="main.cases.permanentDeleteTitle" defaultMessage="Confirm deletion of case" />
                                </h2>
                            </div>
                            <div className="modal-content">
                                <p>
                                    <FormattedMessage
                                        id="main.cases.permanentDeleteText"
                                        defaultMessage="All related data will be deleted (test, patient, ...)."
                                    />
                                </p>
                                <p>
                                    <FormattedMessage
                                        id="main.cases.permanentDeleteText2"
                                        defaultMessage="A back-up will be made before any deletion."
                                    />
                                </p>
                            </div>
                        </Fragment>
                    )
                }
                {
                    deleteError
                    && (
                        <div className="error-container">
                            <Warning />
                            {' '}
                            <FormattedMessage id="main.cases.errorOnPermanentDelete" defaultMessage="Back-up of case failed" />
                        </div>
                    )
                }
                {
                    deleteResult
                    && !loading
                    && !deleteError
                    && (
                        <Fragment>
                            <div className="success-container">
                                <Check />
                                <FormattedMessage id="main.cases.succesFullDelete" defaultMessage="Case has been correctly deleted" />
                            </div>
                            <div className="modal-content">
                                <p>
                                    <FormattedMessage
                                        id="main.cases.testCountDeleted"
                                        defaultMessage="Deleted test(s)"
                                    />
                                    {': '}
                                    {
                                        deleteResult.deleted_tests
                                            ? deleteResult.deleted_tests[0]
                                            : 0
                                    }
                                </p>
                                <p>
                                    <FormattedMessage
                                        id="main.cases.patientCountDeleted"
                                        defaultMessage="Deleted patient(s)"
                                    />
                                    {': '}
                                    {
                                        deleteResult.deleted_patient
                                            ? deleteResult.deleted_patient[0]
                                            : 0
                                    }
                                </p>

                                {
                                    deleteResult.deleted_patient
                                    && (
                                        <Fragment>
                                            <p>
                                                <FormattedMessage
                                                    id="main.cases.treatmentCountDeleted"
                                                    defaultMessage="Deleted treatment(s)"
                                                />
                                                {': '}
                                                {
                                                    deleteResult.deleted_patient[2]
                                                        ? deleteResult.deleted_patient[2]['patient.Treatment']
                                                        : 0
                                                }
                                            </p>
                                            <p>
                                                <FormattedMessage
                                                    id="main.cases.duplicateCountDeleted"
                                                    defaultMessage="Deleted dupe(s)"
                                                />
                                                {': '}
                                                {
                                                    deleteResult.deleted_patient[2]
                                                        ? deleteResult.deleted_patient[2]['patient.PatientDuplicatesPair']
                                                        : 0
                                                }
                                            </p>
                                        </Fragment>
                                    )
                                }
                            </div>
                        </Fragment>
                    )
                }
                <div className="delete-modal-buttons">
                    {
                        ((!deleteResult && !deleteError)
                        || (deleteResult && !deleteError && loading))
                        && (
                            <Fragment>
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
                            </Fragment>
                        )
                    }
                    {
                        (deleteResult || deleteError)
                        && !loading
                        && (
                            <button
                                className="button"
                                onClick={() => this.onCloseModal()}
                            >
                                <FormattedMessage id="main.label.close" defaultMessage="Close" />
                            </button>
                        )
                    }
                </div>
            </ReactModal>
        );
    }
}
DeleteCaseModalComponent.defaultProps = {
    deleteResult: null,
};

DeleteCaseModalComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    setCaseDeleted: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    caseItem: PropTypes.object.isRequired,
    deleteResult: PropTypes.object,
    onDeleteCase: PropTypes.func.isRequired,
    deleteError: PropTypes.bool.isRequired,
    load: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCaseDeleted: deleteResult => dispatch(casesActions.setCaseDeleted(deleteResult)),
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(DeleteCaseModalComponent));
