import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import PatientInfos from '../components/PatientInfos';
import PatientCasesInfos from '../components/PatientCasesInfos';
import PatientCasesLocation from '../components/PatientCasesLocation';
import PatientCasesTests from '../components/PatientCasesTests';

class PatientDetailsWrapper extends React.Component {
    render() {
        const {
            patient,
            testsMapping,
            params,
        } = this.props;
        return (
            <section>
                <div className="widget__container" >
                    <div className="widget__header" >
                        <h2 className="widget__heading">
                            <FormattedMessage id="patientsCasesLocation.tableTitle" defaultMessage="Patient" />:
                        </h2>
                    </div>
                    <div className="widget__content patient-detail">
                        <PatientInfos patient={patient} />
                    </div>
                </div>
                {
                    patient.cases &&
                    <div className="widget__container" >
                        <div className="widget__header">
                            <h2 className="padding-bottom widget__heading">
                                <FormattedMessage id="datas.doneTests.header.title" defaultMessage="Tests effectués" />:
                            </h2>
                        </div>
                        <div className="widget__content">
                            <ul className="cases-list">
                                {
                                    patient.cases.map(c => (
                                        <li
                                            key={c.id}
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
                                                />
                                            </div>
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
    patient: PropTypes.object.isRequired,
    testsMapping: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

const PatientDetailsWrapperWithIntl = injectIntl(PatientDetailsWrapper);

export default PatientDetailsWrapperWithIntl;
