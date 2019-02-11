import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { patientsActions } from '../redux/patients';
import DuplicatePatientDetailsWrapper from '../components/DuplicatePatientDetailsWrapper';
import MergedPatientDetailsWrapper from '../components/MergedPatientDetailsWrapper';

class PatientDuplicateDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: null,
            duplicatePatient: null,
            mergedPatient: null,
            manualMerge: false,
            conflicts: [],
        };
    }

    componentDidMount() {
        this.props.fetchDuplicatesDetails(this.props.params.patient_id, this.props.params.patient_id_2);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            patient: nextProps.patient,
            duplicatePatient: nextProps.duplicatePatient,
            mergedPatient: nextProps.mergedPatient,
            conflicts: nextProps.conflicts,
            manualMerge: nextProps.params.manual_merge === 'true',
        });
    }

    goBack() {
        const { params } = this.props;
        const tempParams = {
            ...params,
        };
        delete tempParams.patient_id;
        delete tempParams.patient_id_2;
        delete tempParams.duplicate_id;
        delete tempParams.manual_merge;
        this.setState({
            patient: null,
            duplicatePatient: null,
        });
        this.props.redirectTo('register/duplicates', {
            ...tempParams,
        });
    }

    toggleManualMerge() {
        this.props.redirectTo('register/duplicates/detail', {
            ...this.props.params,
            manual_merge: !this.state.manualMerge,
        });
    }

    resetMergedPatient() {
        const { dispatch } = this.props;
        dispatch(patientsActions.getManualMergedPatient(this.props.patient, this.props.duplicatePatient));
    }

    fixConflict(key, value) {
        if (value && this.state.manualMerge) {
            const { dispatch } = this.props;
            const tempMergedPatient = {
                ...this.state.mergedPatient,
            };
            tempMergedPatient[key] = value;
            const tempConflicts = [];
            tempConflicts.splice(this.state.conflicts.indexOf(key), 1);
            this.state.conflicts.map((c) => {
                const conflict = {
                    ...c,
                };
                if (conflict.key === key) {
                    conflict.value = value;
                }
                tempConflicts.push(conflict);
                return null;
            });
            dispatch(patientsActions.setManualMergedPatient(tempMergedPatient, tempConflicts));
        }
    }

    manualMerge() {
        const newPatient = {
            ...this.state.mergedPatient,
        };
        newPatient.id = this.props.patient.id;
        this.props.saveAndMergePatient(newPatient, this.props.patient.id, this.props.params.duplicate_id, this);
    }

    render() {
        const { loading } = this.props.load;
        const {
            intl: {
                formatMessage,
            },
            testsMapping,
            params,
        } = this.props;
        const {
            patient,
            duplicatePatient,
            mergedPatient,
            manualMerge,
            conflicts,
        } = this.state;
        const conflictsNotSolved = conflicts.filter(c => c.value === undefined);
        return (
            <section>
                {
                    loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                <div className="widget__container ">
                    <div className="widget__header with-button">
                        <button
                            className="button--back"
                            onClick={() => this.goBack()}
                        >
                            <i className="fa fa-arrow-left" />{' '}
                        </button>
                        <h2 className="widget__heading">
                            <FormattedMessage id="datas.patientsDuplicate.header.title" defaultMessage="Détail Doublon" />:
                        </h2>
                        <div className="widget__header-button-container">
                            <button
                                className="button margin-right"
                                onClick={() => this.toggleManualMerge()}
                            >
                                {
                                    !manualMerge &&
                                    <FormattedMessage
                                        id="patientsDuplicate.manualMerge"
                                        defaultMessage="Fusionner manuellement"
                                    />
                                }
                                {
                                    manualMerge &&
                                    <FormattedMessage
                                        id="patientsDuplicate.autoMerge"
                                        defaultMessage="Fusionner automatiquement"
                                    />
                                }
                            </button>
                            <button
                                className="button"
                                onClick={() => this.props.mergeDuplicates(duplicatePatient.id, this.props.params.duplicate_id, this, true)}
                            >
                                <FormattedMessage id="patientsDuplicate.keep" defaultMessage="Ignorer ce doublon" />
                            </button>
                        </div>
                    </div>

                    {
                        manualMerge &&
                        <div className="align-right padding big-padding-right">
                            {
                                mergedPatient &&
                                <div className="conflicts-count-container">
                                    {
                                        conflictsNotSolved.length !== 0 &&
                                        <span className="error-text">
                                            {`${conflictsNotSolved.length} `}
                                            <FormattedMessage
                                                id="patientsDuplicate.conflicts"
                                                defaultMessage="conflit(s) à fixer"
                                            />
                                        </span>
                                    }
                                    {
                                        conflictsNotSolved.length === 0 &&
                                        <span className="success-text">
                                            <FormattedMessage
                                                id="patientsDuplicate.conflictssolved"
                                                defaultMessage="Tous les conflits sont réglés"
                                            />
                                        </span>
                                    }
                                </div>
                            }
                            <button
                                className="button margin-right"
                                disabled={conflictsNotSolved.length === conflicts.length}
                                onClick={() => this.resetMergedPatient()}
                            >
                                <FormattedMessage
                                    id="patientsDuplicate.cancel"
                                    defaultMessage="Annuler"
                                />
                            </button>
                            <button
                                className="button"
                                disabled={conflictsNotSolved.length !== 0}
                                onClick={() => this.manualMerge()}
                            >
                                <FormattedMessage
                                    id="patientsDuplicate.mergeManualButton"
                                    defaultMessage="Valider"
                                />
                            </button>
                        </div>
                    }
                    <div className={`widget__content ${manualMerge ? ' merge-container border-top' : ''}`}>
                        {
                            patient && patient.id &&
                            duplicatePatient && duplicatePatient.id &&
                            <DuplicatePatientDetailsWrapper
                                patient={patient}
                                duplicatePatient={duplicatePatient}
                                testsMapping={testsMapping}
                                params={params}
                                manualMerge={manualMerge}
                                mergeDuplicates={(patientIdA, patientIdB) => this.props.mergeDuplicates(patientIdA, patientIdB, this)}
                                fixConflict={(key, value) => this.fixConflict(key, value)}
                                conflicts={conflicts}
                            />
                        }
                        {
                            manualMerge &&
                            patient && patient.id &&
                            duplicatePatient && duplicatePatient.id &&
                            mergedPatient &&
                            <MergedPatientDetailsWrapper
                                mergedPatient={mergedPatient}
                                testsMapping={testsMapping}
                                conflicts={conflicts}
                            />
                        }
                    </div>
                </div>
            </section>);
    }
}
PatientDuplicateDetails.defaultProps = {
    mergedPatient: null,
};

PatientDuplicateDetails.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchDuplicatesDetails: PropTypes.func.isRequired,
    patient: PropTypes.object.isRequired,
    duplicatePatient: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    testsMapping: PropTypes.object.isRequired,
    mergeDuplicates: PropTypes.func.isRequired,
    mergedPatient: PropTypes.object,
    conflicts: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    saveAndMergePatient: PropTypes.func.isRequired,
};

const PatientDuplicateDetailsIntl = injectIntl(PatientDuplicateDetails);

const MapStateToProps = state => ({
    load: state.load,
    patient: state.patients.current,
    duplicatePatient: state.patients.duplicateCurrent,
    testsMapping: state.patients.testsMapping,
    mergedPatient: state.patients.manualMergedPatient,
    conflicts: state.patients.manualMergedConflicts,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchDuplicatesDetails: (patientId, patientId2) => dispatch(patientsActions.fetchDuplicatesDetails(dispatch, patientId, patientId2)),
    mergeDuplicates: (targetId, duplicateId, element, ignore = false) => dispatch(patientsActions.mergeDuplicates(dispatch, duplicateId, targetId, element, ignore)),
    saveAndMergePatient: (patient, targetId, duplicateId, element) => dispatch(patientsActions.saveAndMergePatient(dispatch, patient, duplicateId, targetId, element)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(PatientDuplicateDetailsIntl);
