import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { push } from 'react-router-redux';

import PatientInfos from './PatientInfos';
import { patientsActions } from '../redux/patients';
import { createUrl } from '../../../utils/fetchData';

const patientPlaceHolder = () => (
    <div className="no-patient">
        <FormattedMessage id="manualDuplicate.label.no-patient" defaultMessage="No patient selected" />
    </div>
);

class ManualDuplicate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
        };
    }

    componentDidUpdate(prevProps) {
        const {
            patientA, patientB, duplicateId, fetchDuplicatePair,
        } = this.props;
        const { isOpen } = this.state;
        if ((patientA || patientB) && !isOpen) this.toggleExpandable();
        if (!duplicateId
            && patientA && patientB
            && ((!prevProps.patientA || !prevProps.patientB)
                || (patientA.id !== prevProps.patientA.id
                    || patientB.id !== prevProps.patientB.id))) {
            fetchDuplicatePair(patientA, patientB);
        }
    }

    goToDuplicateDetail() {
        const {
            redirectTo, patientA, patientB, duplicateId, params,
        } = this.props;
        const tempParams = {
            patient_id: patientA.id,
            patient_id_2: patientB.id,
            duplicate_id: duplicateId,
            ...params,
            register: true,
        };
        redirectTo('register/duplicates/detail', tempParams);
    }

    toggleExpandable() {
        this.setState({
            isOpen: !this.state.isOpen,
        });
    }

    render() {
        const {
            toggleManualDuplicate,
            patientA,
            patientB,
            saveManualDuplicate,
            duplicateId,
            fetchingPair,
        } = this.props;
        const {
            isOpen,
        } = this.state;
        return (
            <div className={`widget__container manual-duplicate ${isOpen ? 'open' : ''}`}>
                <div
                    className="widget__header manual-duplicate_header"
                    role="button"
                    tabIndex={0}
                    onClick={() => this.toggleExpandable()}
                >
                    <h2 className="widget__heading manual-duplicate_heading">
                        <FormattedMessage id="manualDuplicate.title" defaultMessage="Manual duplicate" />
                    </h2>
                </div>
                <section
                    className={`manual-duplicate_expandable ${isOpen ? 'open' : ''}`}
                >
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
                                disabled={!patientA || !patientB || duplicateId || fetchingPair}
                                className="button manual-duplicate_container--save-button"
                                onClick={() => saveManualDuplicate(patientA, patientB)}
                            >
                                <i className="fa fa-plus" aria-hidden="true" />
                                <FormattedMessage id="manualDuplicate.label.save" defaultMessage="Add to duplicate" />
                            </button>
                            <button
                                type="button"
                                disabled={!duplicateId}
                                className="button manual-duplicate_container--save-button margin-bottom"
                                onClick={() => this.goToDuplicateDetail()}
                            >
                                <i className="fa fa-eye" aria-hidden="true" />
                                <FormattedMessage id="manualDuplicate.label.details" defaultMessage="Duplicate detail" />
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }
}

ManualDuplicate.defaultProps = {
    patientA: null,
    patientB: null,
    fetchingPair: false,
    duplicateId: null,
};

ManualDuplicate.propTypes = {
    toggleManualDuplicate: PropTypes.func.isRequired,
    saveManualDuplicate: PropTypes.func.isRequired,
    patientA: PropTypes.object,
    patientB: PropTypes.object,
    duplicateId: PropTypes.number,
    redirectTo: PropTypes.func.isRequired,
    fetchDuplicatePair: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    fetchingPair: PropTypes.bool,
};

const MapStateToProps = state => ({
    patientA: state.patients.manualDuplicate.patientA,
    patientB: state.patients.manualDuplicate.patientB,
    duplicateId: state.patients.manualDuplicate.duplicateId,
    fetchingPair: state.patients.manualDuplicate.fetchingPair,
});


const MapDispatchToProps = dispatch => ({
    dispatch,
    saveManualDuplicate: (patientA, patientB) => dispatch(patientsActions.saveManualDuplicate(dispatch, patientA, patientB)),
    fetchDuplicatePair: (patientA, patientB) => dispatch(patientsActions.fetchDuplicatePair(dispatch, patientA.id, patientB.id)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManualDuplicate);
