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
            patient, duplicatePatient, testsMapping, isInline, showInfosTitle,
        } = this.props;
        return (
            <div className={isInline ? 'widget__content' : 'not-inline'} >
                <div className="patient-detail">
                    <PatientInfos patient={patient} duplicatePatient={duplicatePatient} showTitle={showInfosTitle} />
                </div>
                {
                    patient.cases &&
                    <div>
                        <h2 className="widget__heading padding-bottom">
                            <FormattedMessage id="datas.doneTests.header.title" defaultMessage="Tests effectués" />:
                        </h2>
                        <ul className="cases-list">
                            {
                                patient.cases.map((c, index) => (
                                    <li key={c.id}>
                                        <div className="case-id">
                                            <span>Hat ID</span>: {c.hat_id}
                                        </div>
                                        <div className={isInline ? 'widget__content--half perfect-fill ' : ''}>
                                            <PatientCasesInfos currentCase={c} similarCase={duplicatePatient && duplicatePatient.cases.length > 0 ? duplicatePatient.cases[index] : undefined} />
                                            <PatientCasesLocation currentCase={c} similarCase={duplicatePatient && duplicatePatient.cases.length > 0 ? duplicatePatient.cases[index] : undefined} />
                                        </div>
                                        <div className="tests-list">
                                            <PatientCasesTests
                                                tests={c.tests}
                                                testsMapping={testsMapping}
                                                similarCase={duplicatePatient && duplicatePatient.cases.length > 0 ? duplicatePatient.cases[index] : undefined}
                                                isInline={isInline}
                                            />
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                }
            </div>
        );
    }
}


PatientDetailsWrapper.defaultProps = {
    isInline: true,
    showInfosTitle: true,
    duplicatePatient: undefined,
};

PatientDetailsWrapper.propTypes = {
    patient: PropTypes.object.isRequired,
    duplicatePatient: PropTypes.object,
    testsMapping: PropTypes.object.isRequired,
    isInline: PropTypes.bool,
    showInfosTitle: PropTypes.bool,
};

const PatientDetailsWrapperWithIntl = injectIntl(PatientDetailsWrapper);

export default PatientDetailsWrapperWithIntl;
