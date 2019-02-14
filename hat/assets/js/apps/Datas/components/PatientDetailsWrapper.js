import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import PatientInfos from '../components/PatientInfos';
import EditPatientInfos from '../components/EditPatientInfos';
import PatientCasesInfos from '../components/PatientCasesInfos';
import PatientCasesLocation from '../components/PatientCasesLocation';
import PatientCasesTests from '../components/PatientCasesTests';
import TreatmentComponent from '../components/TreatmentComponent';
import TabsComponent from '../../../components/TabsComponent';
import LayersComponent from '../../../components/LayersComponent';
import VillageMap from '../../../components/VillageMap';
import { getRequest, createUrl } from '../../../utils/fetchData';
import { mapActions } from '../../../redux/mapReducer';
import { renderTestLabel } from '../../../utils/mapUtils';
import { scrollTo } from '../../../utils';
import { patientsActions } from '../redux/patients';
import { filterActions } from '../../../redux/filtersRedux';

const MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Patient',
        id: 'management.detail.infos',
    },
    tests: {
        defaultMessage: 'Tests',
        id: 'management.detail.geo',
    },
    map: {
        defaultMessage: 'Carte',
        id: 'management.detail.map',
    },
});

let timerSuccess;
let timerError;

const clearTimer = () => {
    if (timerSuccess) {
        clearTimeout(timerSuccess);
    }
    if (timerError) {
        clearTimeout(timerError);
    }
};

class PatientDetailsWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 'infos',
            canEditPatientInfos: false,
            baseUrl: props.params.case_id ? 'tests/detail' : 'register/detail',
        };
    }

    componentDidMount() {
        const {
            dispatch,
            patient,
            params,
            redirectTo,
        } = this.props;
        if (patient.cases.length > 0) {
            dispatch(mapActions.setVillageslist(patient.cases));
        }
        if (this.props.params.case_id && this.props.params.tab === 'tests') {
            setTimeout(() => {
                scrollTo('selected-case');
            }, 500);
        }
        if (patient) {
            const newParams = {
                ...params,
                prov_id: patient.province_id,
                ZS_id: patient.ZS_id,
                AS_id: patient.AS_id,
                vil_id: patient.village_id,
            };
            redirectTo(this.state.baseUrl, newParams);
        }
    }

    componentWillReceiveProps(newProps) {
        const {
            currentUser,
            permissions,
            params: {
                prov_id,
                ZS_id,
                AS_id,
                vil_id,
            },
        } = newProps;
        if (currentUser.id && permissions.length > 0) {
            const editionRight = permissions.find(p => p.codename === 'x_datas_patient_edition');
            if ((currentUser.is_superuser ||
                    currentUser.permissions.find(p => p === editionRight.id))) {
                this.setState({
                    canEditPatientInfos: true,
                });
            }
        }
        if (newProps.isUpdated) {
            timerSuccess = setTimeout(() => {
                newProps.setIsUpdated(false);
            }, 10000);
        }
        if (newProps.hasError) {
            timerSuccess = setTimeout(() => {
                newProps.setHasError(false);
            }, 10000);
        }
        if (prov_id !== this.props.params.prov_id) {
            this.props.selectProvince(prov_id);
        } else if (ZS_id !== this.props.params.ZS_id) {
            this.props.selectZone(ZS_id);
        } else if (AS_id !== this.props.params.AS_id) {
            this.props.selectArea(AS_id);
        } else if (vil_id !== this.props.params.vil_id) {
            this.props.selectVillage(vil_id);
        }
    }

    componentWillUnmount() {
        clearTimer();
    }

    savePatient(patient) {
        clearTimer();
        this.props.savePatient(patient);
    }

    render() {
        const {
            patient,
            testsMapping,
            params,
            getShape,
            changeLayer,
            intl: {
                formatMessage,
            },
            map: {
                villages,
                baseLayer,
            },
            savePatient,
            hasError,
            isUpdated,
            geoFilters,
            redirectTo,
        } = this.props;
        const {
            currentTab,
            canEditPatientInfos,
            baseUrl,
        } = this.state;
        return (
            <section>
                <TabsComponent
                    selectTab={key => (this.setState({ currentTab: key }))}
                    params={params}
                    defaultPath={baseUrl}
                    tabs={[
                        { label: formatMessage(MESSAGES.infos), key: 'infos' },
                        { label: formatMessage(MESSAGES.tests), key: 'tests' },
                        { label: formatMessage(MESSAGES.map), key: 'map' },
                    ]}
                    defaultSelect={currentTab}
                />

                {
                    currentTab === 'infos' &&
                    <div className="widget__container" >
                        <div className="widget__content patient-detail">
                            {
                                canEditPatientInfos &&
                                <EditPatientInfos
                                    patient={patient}
                                    savePatient={newPatient => savePatient(newPatient)}
                                    hasError={hasError}
                                    isUpdated={isUpdated}
                                    geoFilters={geoFilters}
                                    params={params}
                                    redirectTo={redirectTo}
                                    baseUrl={baseUrl}
                                />
                            }
                            {
                                !canEditPatientInfos &&
                                <PatientInfos patient={patient} />
                            }
                        </div>
                    </div>
                }

                {
                    patient.cases &&
                    currentTab === 'tests' &&
                    <section>
                        <div className="widget__container" >
                            <div className="widget__content">
                                <ul className="cases-list">
                                    {
                                        patient.cases.map(c => (
                                            <li
                                                key={c.id}
                                                id={(params.case_id && parseInt(params.case_id, 10) === c.id) ? 'selected-case' : ''}
                                                className={(params.case_id && parseInt(params.case_id, 10) === c.id) ? 'selected-case' : ''}
                                            >
                                                <div className="case-id">
                                                    <span>Hat ID</span>: {c.hat_id} - <span>ID</span>: {c.id}
                                                </div>
                                                <div className="widget__content--half perfect-fill">
                                                    <PatientCasesInfos currentCase={c} />
                                                    <PatientCasesLocation currentCase={c} />
                                                </div>
                                                <div className="tests-list">
                                                    <PatientCasesTests
                                                        tests={c.tests}
                                                        testsMapping={testsMapping}
                                                        currentCase={c}
                                                    />
                                                </div>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>

                        {
                            patient.treatments.length > 0 &&
                            <div className="widget__container" >
                                <div className="widget__header">
                                    <h2 className="widget__heading">
                                        <FormattedMessage id="datas.treatments.header.title" defaultMessage="Traitement(s)" />:
                                    </h2>
                                </div>
                                <div className="widget__content">
                                    <ul className="treatments-list">
                                        {
                                            patient.treatments.map(t => (
                                                <li
                                                    key={t.id}
                                                >
                                                    <TreatmentComponent
                                                        treatment={t}
                                                    />
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            </div>
                        }
                    </section>
                }

                <section className={this.state.currentTab !== 'map' ? 'hidden-opacity' : ''} >
                    <div className="widget__container" >
                        <div className="flex-container">
                            <div className="split-selector-container ">
                                <LayersComponent
                                    base={baseLayer}
                                    change={(type, key) => changeLayer(type, key)}
                                />
                                <div className="map__option padding-top">
                                    <span className="map__option__header">
                                        <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                                    </span>
                                    <form>
                                        <ul className="map__option__list legend">
                                            <li className="map__option__list__item">
                                                <i className="map__option__icon--without-positive-cases" />
                                                <FormattedMessage id="datas.detail.legend.noNewCases" defaultMessage="Tests négatifs" />
                                            </li>
                                            <li className="map__option__list__item">
                                                <i className="map__option__icon--with-positive-cases" />
                                                <FormattedMessage id="datas.detail.legend.newCases" defaultMessage="Tests positifs" />
                                            </li>
                                        </ul>
                                    </form>
                                </div>
                            </div>
                            <div className="split-map ">
                                <VillageMap
                                    baseLayer={baseLayer}
                                    villages={villages}
                                    getShape={type => getShape(type)}
                                    renderVillageLabel={village => renderTestLabel(village, formatMessage, testsMapping)}
                                    isRed={village => village.tests.find(t => parseInt(t.result, 10) > 1)}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </section>
        );
    }
}

PatientDetailsWrapper.propTypes = {
    intl: PropTypes.object.isRequired,
    patient: PropTypes.object.isRequired,
    testsMapping: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    getShape: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    permissions: PropTypes.array.isRequired,
    savePatient: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    hasError: PropTypes.bool.isRequired,
    geoFilters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    map: state.map,
    currentUser: state.currentUser.user,
    permissions: state.currentUser.permissions,
    isUpdated: state.patients.isUpdated,
    hasError: state.patients.hasError,
    geoFilters: state.geoFilters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    getShape: url => getRequest(url, dispatch, null, false),
    savePatient: patient => dispatch(patientsActions.savePatient(dispatch, patient)),
    setIsUpdated: value => dispatch(patientsActions.setIsUpdated(value)),
    setHasError: value => dispatch(patientsActions.setErrorOnUpdated(value)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId, true, false, 'YES,NO,OTHER')),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId, false, 'YES,NO,OTHER')),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, true, zoneId, villageId, false, 'YES,NO,OTHER')),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId)),
});
const PatientDetailsWrapperWithIntl = injectIntl(PatientDetailsWrapper);

export default connect(MapStateToProps, MapDispatchToProps)(PatientDetailsWrapperWithIntl);
