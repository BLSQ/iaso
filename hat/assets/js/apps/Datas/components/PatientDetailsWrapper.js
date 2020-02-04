import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import Add from '@material-ui/icons/AddCircle';

import PatientInfos from './PatientInfos';
import EditPatientInfos from './EditPatientInfos';
import PatientCasesInfos from './PatientCasesInfos';
import CaseInfoLocation from './CaseInfoLocation';
import CaseInfectionLocation from './CaseInfectionLocation';
import PatientCasesTests from './PatientCasesTests';
import TreatmentComponent from './TreatmentComponent';
import TabsComponent from '../../../components/TabsComponent';
import LayersComponent from '../../../components/LayersComponent';
import TestModal from './TestModalComponent';
import CaseModal from './CaseModalComponent';
import CaseLocationModal from './CaseLocationModalComponent';
import CaseInfectionLocationModalComponent from './CaseInfectionLocationModalComponent';

import TestsMap from './TestsMap';
import { getRequest, createUrl } from '../../../utils/fetchData';
import { mapActions } from '../redux/mapReducer';
import { scrollTo, scrollToTop, userHasPermission } from '../../../utils';
import { patientsActions } from '../redux/patients';
import { filterActions } from '../../../redux/filtersRedux';
import { loadActions } from '../../../redux/load';
import DynamicLegend from './DynamicLegend';

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
        defaultMessage: 'Map',
        id: 'management.detail.map',
    },
});

class PatientDetailsWrapper extends React.Component {
    constructor(props) {
        super(props);
        const {
            currentUser,
            permissions,
        } = props;
        this.state = {
            currentTab: 'infos',
            canEditPatientInfos:
                userHasPermission(permissions, currentUser, 'x_datas_patient_edition'),
            baseUrl: props.params.case_id ? 'tests/detail' : 'register/detail',
            showTestModale: false,
            editedTest: undefined,
            showCaseModale: false,
            showCaseLocationModale: false,
            showCaseInfectionLocationModale: false,
            editedCase: undefined,
        };
    }

    componentWillMount() {
        const {
            params,
        } = this.props;

        if (params.patient_id === '0') {
            this.toggleEdit();
        }
    }

    componentDidMount() {
        const {
            dispatch,
            patient,
            params,
            redirectTo,
        } = this.props;
        if (patient.cases && patient.cases.length > 0) {
            dispatch(mapActions.setMappedCaseslist(patient.cases));
        }
        if (this.props.params.case_id && this.props.params.tab === 'tests') {
            scrollTo('selected-case');
        }
        if (patient && patient.province_id) {
            const newParams = {
                ...params,
                prov_id: patient.province_id,
                ZS_id: patient.ZS_id,
                AS_id: patient.AS_id,
                vil_id: patient.village_id,
            };
            redirectTo(this.state.baseUrl, newParams);
        }

        if (params.prov_id && patient.id === 0) {
            dispatch(loadActions.startLoading());
            this.props.selectProvince(params.prov_id, params.ZS_id, params.AS_id, params.vil_id);
        }
    }

    componentWillReceiveProps(newProps) {
        const {
            dispatch,
            params: {
                prov_id,
                ZS_id,
                AS_id,
                vil_id,
            },
            params,
        } = newProps;
        const {
            editEnabled,
        } = this.state;
        if (prov_id !== this.props.params.prov_id) {
            if (prov_id) {
                dispatch(loadActions.startLoading());
            }
            this.props.selectProvince(prov_id, ZS_id, AS_id, vil_id);
        } else if (ZS_id !== this.props.params.ZS_id) {
            if (ZS_id) {
                dispatch(loadActions.startLoading());
            }
            this.props.selectZone(ZS_id, AS_id, vil_id);
        } else if (AS_id !== this.props.params.AS_id) {
            if (AS_id) {
                dispatch(loadActions.startLoading());
            }
            this.props.selectArea(AS_id, vil_id);
        } else if (vil_id !== this.props.params.vil_id) {
            this.props.selectVillage(vil_id);
        }

        if (params.patient_id === '0') {
            if (!editEnabled) {
                this.toggleEdit();
            }
        }
    }

    savePatient(patient) {
        const {
            savePatient,
            params,
            redirectTo,
        } = this.props;
        const {
            baseUrl,
        } = this.state;
        savePatient(patient, params, redirectTo, baseUrl);
    }

    toggleEdit() {
        const {
            patient,
        } = this.props;
        if (patient.province_id) {
            this.props.selectProvince(
                patient.province_id,
                patient.ZS_id,
                patient.AS_id,
                patient.village_id,
            );
        }
        this.setState({
            editEnabled: !this.state.editEnabled,
        });
    }

    toggleTestModal(editedTest, editedCase, scrollToBottom) {
        if (scrollToBottom) {
            if (!this.state.editedTest) {
                scrollTo('bottom-tests');
            }
        }
        this.setState({
            showTestModale: !this.state.showTestModale,
            editedTest,
            editedCase,
        });
    }

    toggleCaseModal(editedCase, needScrollToTop) {
        if (needScrollToTop) {
            if (!this.state.editedCase) {
                scrollToTop();
            }
        }
        this.setState({
            showCaseModale: !this.state.showCaseModale,
            editedCase,
        });
    }

    toggleCaseLocationModal(editedCase) {
        this.setState({
            showCaseLocationModale: !this.state.showCaseLocationModale,
            editedCase,
        });
    }

    toggleCaseInfectionLocationModal(editedCase) {
        this.setState({
            showCaseInfectionLocationModale: !this.state.showCaseInfectionLocationModale,
            editedCase,
        });
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
                cases,
                baseLayer,
            },
            geoFilters,
            redirectTo,
            setCaseslist,
        } = this.props;
        const {
            currentTab,
            canEditPatientInfos,
            baseUrl,
            editEnabled,
            showTestModale,
            editedTest,
            showCaseModale,
            showCaseLocationModale,
            showCaseInfectionLocationModale,
            editedCase,
        } = this.state;
        return (
            <section>
                <TabsComponent
                    selectTab={key => (this.setState({ currentTab: key }))}
                    params={params}
                    defaultPath={baseUrl}
                    tabs={[
                        { label: formatMessage(MESSAGES.infos), key: 'infos' },
                        { label: formatMessage(MESSAGES.tests), key: 'tests', disabled: patient.id === 0 },
                        { label: formatMessage(MESSAGES.map), key: 'map', disabled: patient.id === 0 },
                    ]}
                    defaultSelect={currentTab}
                />

                {
                    currentTab === 'infos'
                    && (
                        <div className="widget__container">
                            <div className="widget__content patient-detail">
                                {
                                    canEditPatientInfos
                                    && editEnabled
                                    && (
                                        <EditPatientInfos
                                            patient={patient}
                                            savePatient={newPatient => this.savePatient(newPatient)}
                                            geoFilters={geoFilters}
                                            params={params}
                                            redirectTo={redirectTo}
                                            baseUrl={baseUrl}
                                            closeEdit={() => this.toggleEdit()}
                                        />
                                    )
                                }
                                {
                                    (!canEditPatientInfos || (canEditPatientInfos && !editEnabled))
                                    && <PatientInfos patient={patient} />
                                }
                                {
                                    canEditPatientInfos
                                    && !editEnabled
                                    && (
                                        <div className="align-right margin-top">
                                            <button
                                                className="button"
                                                onClick={() => this.toggleEdit()}
                                            >
                                                <FormattedMessage
                                                    id="main.label.edit"
                                                    defaultMessage="Edit"
                                                />
                                            </button>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    )
                }

                {
                    patient.cases
                    && currentTab === 'tests'
                    && (
                        <section>
                            <div className="widget__container">
                                <div className="widget__content">
                                    {
                                        showCaseModale
                                        && (
                                            <CaseModal
                                                params={params}
                                                showModale={showCaseModale}
                                                toggleModal={scrollToBottom => this.toggleCaseModal(undefined, scrollToBottom)}
                                                currentCase={editedCase}
                                                patientId={patient.id}
                                            />
                                        )
                                    }
                                    {
                                        showCaseLocationModale
                                        && (
                                            <CaseLocationModal
                                                params={params}
                                                showModale={showCaseLocationModale}
                                                toggleModal={() => this.toggleCaseLocationModal(undefined)}
                                                currentCase={editedCase}
                                                patientId={patient.id}
                                            />
                                        )
                                    }
                                    {
                                        showCaseInfectionLocationModale
                                        && (
                                            <CaseInfectionLocationModalComponent
                                                params={params}
                                                showModale={showCaseInfectionLocationModale}
                                                toggleModal={() => this.toggleCaseInfectionLocationModal(undefined)}
                                                currentCase={editedCase}
                                                currentPatient={patient}
                                            />
                                        )
                                    }
                                    {
                                        showTestModale
                                        && (
                                            <TestModal
                                                params={params}
                                                showModale={showTestModale}
                                                toggleModal={scrollToBottom => this.toggleTestModal(undefined, undefined, scrollToBottom)}
                                                currentCase={editedCase}
                                                currentTest={editedTest}
                                                patientId={patient.id}
                                            />
                                        )
                                    }
                                    <ul className="cases-list">
                                        {
                                            patient.cases.map(c => (
                                                <li
                                                    key={c.id}
                                                    id={(params.case_id && parseInt(params.case_id, 10) === c.id) ? 'selected-case' : ''}
                                                    className={(params.case_id && parseInt(params.case_id, 10) === c.id) ? 'selected-case' : ''}
                                                >
                                                    {
                                                        canEditPatientInfos
                                                        && (
                                                            <Tooltip
                                                                title={<FormattedMessage id="main.label.test.add" defaultMessage="Add a test" />}
                                                            >
                                                                <IconButton
                                                                    className="add-test-button"
                                                                    onClick={() => this.toggleTestModal(undefined, c)}
                                                                >
                                                                    <Add color="primary" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )
                                                    }
                                                    <div className="case-id">
                                                        <span>Hat ID</span>
                                                        :
                                                        {' '}
                                                        {c.hat_id}
                                                        {' '}
                                                        -
                                                        {' '}
                                                        <span>ID</span>
                                                        :
                                                        {' '}
                                                        {c.id}
                                                    </div>
                                                    <div className="widget__content--half perfect-fill">
                                                        <PatientCasesInfos
                                                            currentCase={c}
                                                            toggleModal={() => this.toggleCaseModal(c)}
                                                            canEditPatientInfos={canEditPatientInfos}
                                                        />
                                                        <CaseInfoLocation
                                                            currentCase={c}
                                                            toggleModal={() => this.toggleCaseLocationModal(c)}
                                                            canEditPatientInfos={canEditPatientInfos}
                                                        />
                                                        <CaseInfectionLocation
                                                            currentCase={c}
                                                            toggleModal={() => this.toggleCaseInfectionLocationModal(c)}
                                                            canEditPatientInfos={canEditPatientInfos}
                                                        />
                                                    </div>
                                                    <div className="tests-list">
                                                        <PatientCasesTests
                                                            tests={c.tests}
                                                            testsMapping={testsMapping}
                                                            currentCase={c}
                                                            toggleModal={test => this.toggleTestModal(test, c)}
                                                            canEditPatientInfos={canEditPatientInfos}
                                                        />
                                                    </div>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                    {
                                        canEditPatientInfos
                                        && (
                                            <div className="align-right margin-top">
                                                <button
                                                    className="button"
                                                    onClick={() => this.toggleCaseModal(undefined)}
                                                >
                                                    <i className="fa fa-plus" />
                                                    <FormattedMessage
                                                        id="main.cases.add"
                                                        defaultMessage="Add a Case"
                                                    />
                                                </button>
                                            </div>
                                        )
                                    }
                                    <span id="bottom-tests" />
                                </div>
                            </div>

                            {
                                patient.treatments.length > 0
                                && (
                                    <div className="widget__container">
                                        <div className="widget__header">
                                            <h2 className="widget__heading">
                                                <FormattedMessage id="datas.treatments.header.title" defaultMessage="Traitement(s)" />
                                                :
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
                                )
                            }
                        </section>
                    )
                }

                <section className={this.state.currentTab !== 'map' ? 'hidden-opacity' : ''}>
                    <div className="widget__container">
                        <div className="flex-container">
                            <div className="split-selector-container ">
                                <DynamicLegend cases={cases} setCaseslist={newCases => setCaseslist(newCases)} />
                                <div className="map__option padding-top margin-bottom">
                                    <span className="map__option__header">
                                        <FormattedMessage id="microplanning.legend.key" defaultMessage="Légende" />
                                    </span>
                                    <form>
                                        <ul className="map__option__list legend with-icons">
                                            <li className="map__option__list__item">
                                                <i className="fa fa-tint negative" />
                                                <FormattedMessage id="main.label.noNewCases" defaultMessage="No new cases" />
                                            </li>
                                            <li className="map__option__list__item">
                                                <i className="fa fa-tint positive" />
                                                <FormattedMessage id="main.label.newCases" defaultMessage="New cases" />
                                            </li>
                                            <li className="map__option__list__item">
                                                <i className="fa fa-home" />
                                                <FormattedMessage id="main.label.villages" defaultMessage="Villages" />
                                            </li>
                                        </ul>
                                    </form>
                                </div>
                                <LayersComponent
                                    base={baseLayer}
                                    change={(type, key) => changeLayer(type, key)}
                                />
                            </div>
                            <div className="split-map ">
                                <TestsMap
                                    baseLayer={baseLayer}
                                    cases={cases}
                                    getShape={type => getShape(type)}
                                    testsMapping={testsMapping}
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
    geoFilters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    setCaseslist: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    map: state.map,
    currentUser: state.currentUser.user,
    permissions: state.currentUser.permissions,
    geoFilters: state.geoFilters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    getShape: url => getRequest(url, dispatch, null, false),
    savePatient: (patient, params, redirectTo, baseUrl) => dispatch(patientsActions.savePatient(dispatch, patient, params, redirectTo, baseUrl)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId, true, true, 'YES,NO,OTHER')),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId, true, 'YES,NO,OTHER')),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, true, zoneId, villageId, true, 'YES,NO,OTHER')),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId)),
    setCaseslist: cases => dispatch(mapActions.setCaseslist(cases)),
});
const PatientDetailsWrapperWithIntl = injectIntl(PatientDetailsWrapper);

export default connect(MapStateToProps, MapDispatchToProps)(PatientDetailsWrapperWithIntl);
