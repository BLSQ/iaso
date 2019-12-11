import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { patientsActions } from '../redux/patients';
import { currentUserActions } from '../../../redux/currentUserReducer';
import PatientDetailsWrapper from '../components/PatientDetailsWrapper';
import { filterActions } from '../../../redux/filtersRedux';
import { smallMapActions } from '../../../redux/smallMapReducer';

class PatientDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: null,
        };
    }

    componentWillMount() {
        this.props.fetchProvinces();
        this.props.fetchDetails(this.props.params.patient_id);
        this.props.fetchCurrentUserInfos();
        this.props.fetchGeoDatas();
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
        this.props.selectProvince(null);
        const baseUrl = params.case_id ? 'tests' : 'register/list';
        delete tempParams.patient_id;
        delete tempParams.case_id;
        delete tempParams.tab;
        delete tempParams.prov_id;
        delete tempParams.ZS_id;
        delete tempParams.AS_id;
        delete tempParams.vil_id;
        tempParams.back = true;
        this.setState({
            patient: null,
        });
        this.props.redirectTo(baseUrl, {
            ...tempParams,
        });
    }

    goToDuplicates(id1, id2, duplicateId) {
        const params = {
            patient_id: id1,
            patient_id_2: id2,
            duplicate_id: duplicateId,
            order: 'id',
            pageSize: 50,
            page: 1,
        };
        this.props.redirectTo('register/duplicates/detail', {
            ...params,
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
        const { patient } = this.state;
        return (
            <section>
                {
                    loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Loading',
                            id: 'main.label.loading',
                        })}
                        />
                    )
                }
                <div className="widget__container big-margin-bottom">
                    <div className="widget__header with-button">
                        <button
                            className="button--back"
                            onClick={() => this.goBack()}
                        >
                            <i className="fa fa-arrow-left" />
                            {' '}
                        </button>
                        <h2 className="widget__heading with-button">
                            <FormattedMessage id="datas.patientDetailCases.header.title" defaultMessage="Detailed informations" />
                            :
                        </h2>
                        {
                            patient && patient.similar_patients && patient.similar_patients.length > 0
                            && (
                                <button
                                    className="button--save"
                                    onClick={() => this.goToDuplicates(patient.id, patient.similar_patients[0].id, patient.similar_patients[0].duplicateId)}
                                >
                                    <i className="fa fa-files-o" />
                                    <FormattedMessage id="datas.label.duplicates.button" defaultMessage="Duplicate" />
                                </button>
                            )
                        }
                    </div>
                </div>
                {
                    patient && patient.id
                    && (
                        <PatientDetailsWrapper
                            patient={patient}
                            testsMapping={testsMapping}
                            params={params}
                        />
                    )
                }
            </section>
        );
    }
}

PatientDetails.defaultProps = {
};

PatientDetails.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetchDetails: PropTypes.func.isRequired,
    patient: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    testsMapping: PropTypes.object.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    fetchGeoDatas: PropTypes.func.isRequired,
};

const PatientDetailsIntl = injectIntl(PatientDetails);

const MapStateToProps = state => ({
    load: state.load,
    patient: state.patients.current,
    testsMapping: state.patients.testsMapping,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchDetails: patientId => dispatch(patientsActions.fetchDetails(dispatch, patientId)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId, true, false, 'YES,NO,OTHER')),
    fetchGeoDatas: () => dispatch(smallMapActions.fetchGeoDatas(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(PatientDetailsIntl);
