import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { patientsActions } from '../redux/patients';
import PatientInfos from '../components/PatientInfos';
import PatientCasesInfos from '../components/PatientCasesInfos';
import PatientCasesLocation from '../components/PatientCasesLocation';
import PatientCasesTests from '../components/PatientCasesTests';


class PatientDuplicateDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: null,
        };
    }

    componentDidMount() {
        this.props.fetchDetails(this.props.params.patient_id);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            patient: nextProps.patient,
        });
    }

    goBack() {
        const { params } = this.props;
        const tempParams = {
            ...params,
        };
        delete tempParams.patient_id;
        this.setState({
            patient: null,
        });
        this.props.redirectTo('register/list', {
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
        } = this.props;
        const { patient } = this.state;
        return (
            <section>
                {
                    loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                {
                    patient && patient.id &&
                    <div className="widget__container ">
                        <div className="widget__header">
                            <button
                                className="button--back"
                                onClick={() => this.goBack()}
                            >
                                <i className="fa fa-arrow-left" />{' '}
                            </button>
                            <h2 className="widget__heading">
                                <FormattedMessage id="datas.patientDetailCases.header.title" defaultMessage="Informations detaillées" />:
                            </h2>
                        </div>
                        <div className="widget__content--quarter">
                            <PatientInfos patient={patient} />

                            {
                                patient.cases &&
                                <div className="three-quarter">
                                    <h2 className="widget__heading padding-bottom">
                                        <FormattedMessage id="datas.doneTests.header.title" defaultMessage="Tests effectués" />:
                                    </h2>
                                    {
                                        patient.cases.map(c => (
                                            <div className="widget__content--tier split-bottom" key={c.id}>
                                                <PatientCasesInfos currentCase={c} />
                                                <PatientCasesLocation currentCase={c} />
                                                <PatientCasesTests tests={c.tests} testsMapping={testsMapping} />
                                            </div>
                                        ))
                                    }
                                </div>
                            }
                        </div>
                    </div>
                }
            </section>);
    }
}

PatientDuplicateDetails.defaultProps = {
};

PatientDuplicateDetails.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchDetails: PropTypes.func.isRequired,
    patient: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    testsMapping: PropTypes.object.isRequired,
};

const PatientDuplicateDetailsIntl = injectIntl(PatientDuplicateDetails);

const MapStateToProps = state => ({
    load: state.load,
    patient: state.patients.current,
    testsMapping: state.patients.testsMapping,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchDetails: patientId => dispatch(patientsActions.fetchDetails(dispatch, patientId)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(PatientDuplicateDetailsIntl);
