import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import PatientInfos from '../components/PatientInfos';
import PatientCasesInfos from '../components/PatientCasesInfos';
import PatientCasesLocation from '../components/PatientCasesLocation';
import PatientCasesTests from '../components/PatientCasesTests';

const renderCase = (caseItem, duplicatePatient, isInline, testsMapping, index) => (
    <li key={caseItem.id}>
        <div className="case-id">
            <span>Hat ID</span>: {caseItem.hat_id} - <span>ID</span>: {caseItem.id}
        </div>
        <div className={isInline ? 'widget__content--half perfect-fill ' : ''}>
            <PatientCasesInfos currentCase={caseItem} similarCase={duplicatePatient && duplicatePatient.cases.length > 0 ? duplicatePatient.cases[index] : undefined} />
            <PatientCasesLocation currentCase={caseItem} similarCase={duplicatePatient && duplicatePatient.cases.length > 0 ? duplicatePatient.cases[index] : undefined} />
        </div>
        <div className="tests-list">
            <PatientCasesTests
                tests={caseItem.tests}
                testsMapping={testsMapping}
                similarCase={duplicatePatient && duplicatePatient.cases.length > 0 ? duplicatePatient.cases[index] : undefined}
                isInline={isInline}
            />
        </div>
    </li>
);

class PatientDetailsWrapper extends React.Component {
    render() {
        const {
            patient,
            duplicatePatient,
            testsMapping,
            isInline,
            showInfosTitle,
            params,
        } = this.props;
        let uniqueCase = null;
        if (params.case_id) {
            uniqueCase = patient.cases.find(c => c.id === parseInt(params.case_id, 10));
        }
        return (
            <section>
                <div className={isInline ? 'widget__container' : 'not-inline'} >
                    {
                        showInfosTitle &&
                        <div className="widget__header">
                            <h2 className="widget__heading">
                                <FormattedMessage id="patientsCasesLocation.tableTitle" defaultMessage="Patient" />:
                            </h2>
                        </div>
                    }
                    <div className={`${isInline ? 'widget__content' : ''} patient-detail`}>
                        <PatientInfos patient={patient} duplicatePatient={duplicatePatient} />
                    </div>
                </div>
                {
                    patient.cases &&
                    <div className={isInline ? 'widget__container' : 'not-inline'} >
                        <div className={`${isInline ? 'widget__header' : ''}`}>
                            <h2 className={`${isInline ? '' : 'padding-bottom'} widget__heading`}>
                                <FormattedMessage id="datas.doneTests.header.title" defaultMessage="Tests effectués" />:
                            </h2>
                        </div>
                        <div className={`${isInline ? 'widget__content' : ''}`}>
                            <ul className="cases-list">
                                {
                                    uniqueCase &&
                                    renderCase(uniqueCase, duplicatePatient, isInline, testsMapping, 1)
                                }
                                {
                                    !uniqueCase &&
                                    patient.cases.map((c, index) => (
                                        renderCase(c, duplicatePatient, isInline, testsMapping, index)
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
    params: PropTypes.object.isRequired,
};

const PatientDetailsWrapperWithIntl = injectIntl(PatientDetailsWrapper);

export default PatientDetailsWrapperWithIntl;
