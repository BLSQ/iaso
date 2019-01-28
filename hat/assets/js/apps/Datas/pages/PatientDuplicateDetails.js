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

const mergeDuplicates = (itemA, itemB) => {
    const mergedItem = {};
    if (itemA) {
        Object.keys(itemA).map((key) => {
            switch (typeof itemA[key]) {
                case 'boolean':
                case 'number':
                    if (itemA[key] === itemB[key]) {
                        mergedItem[key] = itemA[key];
                    } else {
                        mergedItem[key] = ' ';
                    }
                    break;
                case 'string':
                    if (itemA[key].toLowerCase() === itemB[key].toLowerCase()) {
                        mergedItem[key] = itemA[key];
                    } else {
                        mergedItem[key] = ' ';
                    }
                    break;
                case 'object':
                    if (Array.isArray(itemA[key])) {
                        mergedItem[key] = itemA[key].concat(itemB[key]);
                    } else if (itemA[key] === null) {
                        mergedItem[key] = ' ';
                    } else {
                        mergedItem[key] = mergeDuplicates(itemA[key], itemB[key]);
                    }
                    break;
                default:
                    break;
            }
            return null;
        });
    }
    delete mergedItem.similar_patients;
    return mergedItem;
};
class PatientDuplicateDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: null,
            duplicatePatient: null,
            mergedPatient: null,
            manualMerge: false,
        };
    }

    componentDidMount() {
        this.props.fetchDuplicatesDetails(this.props.params.patient_id, this.props.params.patient_id_2);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            patient: nextProps.patient,
            duplicatePatient: nextProps.duplicatePatient,
            mergedPatient: mergeDuplicates(nextProps.patient, nextProps.duplicatePatient),
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
        this.setState({
            patient: null,
            duplicatePatient: null,
        });
        this.props.redirectTo('register/duplicates', {
            ...tempParams,
        });
    }

    toggleManualMerge() {
        this.setState({
            manualMerge: !this.state.manualMerge,
            mergedPatient: mergeDuplicates(this.props.patient, this.props.duplicatePatient),
        });
    }

    render() {
        const { loading } = this.props.load;
        const {
            intl: {
                formatMessage,
            },
            testsMapping,
        } = this.props;
        const {
            patient,
            duplicatePatient,
            mergedPatient,
            manualMerge,
        } = this.state;
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
                        <button
                            className="button--warning"
                            onClick={() => this.props.mergeDuplicates(duplicatePatient.id, this.props.params.duplicate_id, this, true)}
                        >
                            <FormattedMessage id="patientsDuplicate.keep" defaultMessage="Ignorer ce doublon" />
                        </button>
                    </div>

                    {
                        patient && patient.id && duplicatePatient && duplicatePatient.id &&
                        <div className="align-center widget__content">
                            {
                                !manualMerge &&
                                <button
                                    className="button"
                                    onClick={() => this.props.mergeDuplicates(patient.id, this.props.params.duplicate_id, this)}
                                >
                                    <FormattedMessage
                                        id="patientsDuplicate.merge"
                                        defaultMessage="Fusionner les patients dans {value}"
                                        values={{
                                            value: 'A',
                                        }}
                                    />
                                </button>
                            }
                            <div className="middle-margin-element">
                                <button
                                    className="button--warning"
                                    onClick={() => this.toggleManualMerge()}
                                >
                                    {
                                        !manualMerge &&
                                        <FormattedMessage
                                            id="patientsDuplicate.manualMerge"
                                            defaultMessage="Fusionner manuelement"
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
                            </div>
                            {
                                !manualMerge &&
                                <button
                                    className="button"
                                    onClick={() => this.props.mergeDuplicates(duplicatePatient.id, this.props.params.duplicate_id, this)}
                                >
                                    <FormattedMessage
                                        id="patientsDuplicate.merge"
                                        defaultMessage="Fusionner les patients dans {value}"
                                        values={{
                                            value: 'B',
                                        }}
                                    />
                                </button>
                            }
                            {
                                manualMerge &&
                                <button
                                    className="button--success float-right"
                                    onClick={() => console.log('manual merge')}
                                >
                                    <FormattedMessage
                                        id="patientsDuplicate.mergeManualButton"
                                        defaultMessage="Valider"
                                    />
                                </button>
                            }
                        </div>
                    }
                    <div className={`widget__content border-top ${manualMerge ? ' merge-container' : ''}`}>
                        {
                            patient && patient.id &&
                            duplicatePatient && duplicatePatient.id &&
                            <DuplicatePatientDetailsWrapper
                                patient={patient}
                                duplicatePatient={duplicatePatient}
                                testsMapping={testsMapping}
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
                            />
                        }
                    </div>
                </div>
            </section>);
    }
}

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
};

const PatientDuplicateDetailsIntl = injectIntl(PatientDuplicateDetails);

const MapStateToProps = state => ({
    load: state.load,
    patient: state.patients.current,
    duplicatePatient: state.patients.duplicateCurrent,
    testsMapping: state.patients.testsMapping,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchDuplicatesDetails: (patientId, patientId2) => dispatch(patientsActions.fetchDuplicatesDetails(dispatch, patientId, patientId2)),
    mergeDuplicates: (targetId, duplicateId, goBack, ignore = false) => dispatch(patientsActions.mergeDuplicates(dispatch, duplicateId, targetId, goBack, ignore)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(PatientDuplicateDetailsIntl);
