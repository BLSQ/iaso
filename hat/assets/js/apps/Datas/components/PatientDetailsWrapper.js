import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import PatientInfos from '../components/PatientInfos';
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

class PatientDetailsWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 'infos',
        };
    }

    componentDidMount() {
        const {
            dispatch,
            patient,
        } = this.props;
        if (patient.cases.length > 0) {
            dispatch(mapActions.setVillageslist(patient.cases));
        }
        if (this.props.params.case_id && this.props.params.tab === 'tests') {
            setTimeout(() => {
                scrollTo('selected-case');
            }, 500);
        }
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
        } = this.props;
        const {
            currentTab,
        } = this.state;
        return (
            <section>
                <TabsComponent
                    selectTab={key => (this.setState({ currentTab: key }))}
                    params={params}
                    defaultPath={params.case_id ? 'tests/detail' : 'register/detail'}
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
                            <PatientInfos patient={patient} />
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
};

const MapStateToProps = state => ({
    map: state.map,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
    getShape: url => getRequest(url, dispatch, null, false),
});
const PatientDetailsWrapperWithIntl = injectIntl(PatientDetailsWrapper);

export default connect(MapStateToProps, MapDispatchToProps)(PatientDetailsWrapperWithIntl);
