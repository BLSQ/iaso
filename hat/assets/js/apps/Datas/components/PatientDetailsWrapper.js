import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import PatientInfos from '../components/PatientInfos';
import PatientCasesInfos from '../components/PatientCasesInfos';
import PatientCasesLocation from '../components/PatientCasesLocation';
import PatientCasesTests from '../components/PatientCasesTests';
import TreatmentComponent from '../components/TreatmentComponent';
import TabsComponent from '../../../components/TabsComponent';

const MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Patient',
        id: 'management.infos',
    },
    tests: {
        defaultMessage: 'Tests',
        id: 'management.geo',
    },
});

Math.easeInOutQuad = (t, b, c, d) => {
    let tempT = t;
    tempT /= d / 2;
    if (tempT < 1) return (c / 2) * tempT * (tempT + b);
    tempT -= 1;
    return (-c / 2) * (((tempT * (tempT - 2)) - 1) + b);
};

const scrollToCase = () => {
    const to = document.getElementById('selected-case').getBoundingClientRect().top;
    window.scroll(0, to);
};


class PatientDetailsWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTab: 'infos',
        };
    }

    componentDidMount() {
        if (this.props.params.case_id) {
            setTimeout(() => {
                scrollToCase();
            }, 300);
        }
    }

    render() {
        const {
            patient,
            testsMapping,
            params,
            intl: {
                formatMessage,
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
                }
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
        );
    }
}


PatientDetailsWrapper.propTypes = {
    intl: PropTypes.object.isRequired,
    patient: PropTypes.object.isRequired,
    testsMapping: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

const PatientDetailsWrapperWithIntl = injectIntl(PatientDetailsWrapper);

export default PatientDetailsWrapperWithIntl;
