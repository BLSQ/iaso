import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { patientsActions } from '../redux/patients';
import DuplicatePatientDetailsWrapper from '../components/DuplicatePatientDetailsWrapper';


class PatientDuplicateDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: null,
            duplicatePatient: null,
        };
    }

    componentDidMount() {
        this.props.fetchDuplicatesDetails(this.props.params.patient_id, this.props.params.patient_id_2);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            patient: nextProps.patient,
            duplicatePatient: nextProps.duplicatePatient,
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

    render() {
        const { loading } = this.props.load;
        const {
            intl: {
                formatMessage,
            },
            testsMapping,
            params,
        } = this.props;
        const { patient, duplicatePatient } = this.state;
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
                    </div>
                    {
                        patient && patient.id && duplicatePatient && duplicatePatient.id &&
                        <div className="align-center widget__content">
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
                            <button
                                className="button--warning middle-margin-element"
                                onClick={() => this.props.mergeDuplicates(duplicatePatient.id, this.props.params.duplicate_id, this, true)}
                            >
                                <FormattedMessage id="patientsDuplicate.keep" defaultMessage="Ignorer ce doublon" />
                            </button>
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
                        </div>
                    }
                    <div className="widget__content border-top">
                        {
                            patient && patient.id &&
                            duplicatePatient && duplicatePatient.id &&
                            <DuplicatePatientDetailsWrapper
                                patient={patient}
                                duplicatePatient={duplicatePatient}
                                testsMapping={testsMapping}
                                isInline={false}
                                params={params}
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
