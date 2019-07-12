import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import PatientInfos from "./PatientInfos";
import { patientsActions } from '../redux/patients';

const patientPlaceHolder = () => (
    <div className="no-patient">
        <FormattedMessage id="manualDuplicate.label.no-patient" defaultMessage="Aucun patient sélectionné" />
    </div>
);

class ManualDuplicate extends Component {
    render() {
        const { toggleManualDuplicate, patientA, patientB, saveManualDuplicate } = this.props;
        return (
            <div className="widget__container">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        <FormattedMessage id="manualDuplicate.title" defaultMessage="Doublon manuel" />
                    </h2>
                </div>
                <div className="widget__content manual-duplicate_container">
                    <div className="manual-duplicate_container--duplicates">
                        {patientA && (
                            <div>
                                <button
                                    type="button"
                                    className="button--delete--tiny manual-duplicate_container--delete-button"
                                    onClick={() => toggleManualDuplicate(patientA)}
                                >
                                    <i className="fa fa-trash manual-duplicate_container--delete-icon" />
                                </button>
                                <PatientInfos patient={patientA} />
                            </div>
                        )}
                        {!patientA && patientPlaceHolder()}
                        {patientB && (
                            <div>
                                <button
                                    type="button"
                                    className="button--delete--tiny manual-duplicate_container--delete-button"
                                    onClick={() => toggleManualDuplicate(patientB)}
                                >
                                    <i className="fa fa-trash manual-duplicate_container--delete-icon" />
                                </button>
                                <PatientInfos patient={patientB} />
                            </div>
                        )}
                        {!patientB && patientPlaceHolder()}
                    </div>
                    <div className="manual-duplicate_container--actions">
                        <button
                            type="button"
                            disabled={!patientA || !patientB}
                            className="button manual-duplicate_container--save-button"
                            onClick={() => saveManualDuplicate(patientA, patientB)}
                        >
                            <FormattedMessage id="manualDuplicate.label.save" defaultMessage="Sauver" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

ManualDuplicate.defaultProps = {
    patientA: null,
    patientB: null,
};

ManualDuplicate.propTypes = {
    toggleManualDuplicate: PropTypes.func.isRequired,
    saveManualDuplicate: PropTypes.func.isRequired,
    patientA: PropTypes.object,
    patientB: PropTypes.object,
};

const MapStateToProps = state => ({
    manualDuplicate: state.patients.manualDuplicate,
    patientA: state.patients.manualDuplicate.patientA,
    patientB: state.patients.manualDuplicate.patientB,
});


const MapDispatchToProps = dispatch => ({
    dispatch,
    saveManualDuplicate: (patientA, patientB) => dispatch(patientsActions.saveManualDuplicate(dispatch, patientA, patientB)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManualDuplicate);
