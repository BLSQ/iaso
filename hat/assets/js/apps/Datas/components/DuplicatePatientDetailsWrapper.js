import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import PatientInfos from './PatientInfos';
import PatientCasesInfos from './PatientCasesInfos';
import PatientCasesLocation from './PatientCasesLocation';
import PatientTestComponent from './PatientTestComponent';

class DuplicatePatientDetailsWrapper extends React.Component {
    render() {
        const {
            patient,
            duplicatePatient,
            testsMapping,
            manualMerge,
            mergeDuplicates,
            params,
            fixConflict,
            conflicts,
        } = this.props;
        return (
            <section className="duplicate-page">
                <table className={`no-style duplicate-table ${patient.cases.length > 0 || patient.cases.length < duplicatePatient.cases.length ? 'margin-bottom' : ''}`}>
                    <thead>
                        {
                            !manualMerge &&
                            <tr>
                                <td className="align-center padding-bottom">
                                    <button
                                        className="button"
                                        onClick={() => mergeDuplicates(patient.id, params.duplicate_id, this)}
                                    >
                                        <FormattedMessage
                                            id="patientsDuplicate.merge"
                                            defaultMessage="Fusionner les patients dans {value}"
                                            values={{
                                                value: 'A',
                                            }}
                                        />
                                    </button>
                                </td>
                                <td className="align-center padding-bottom">
                                    <button
                                        className="button"
                                        onClick={() => mergeDuplicates(duplicatePatient.id, params.duplicate_id, this)}
                                    >
                                        <FormattedMessage
                                            id="patientsDuplicate.merge"
                                            defaultMessage="Fusionner les patients dans {value}"
                                            values={{
                                                value: 'B',
                                            }}
                                        />
                                    </button>
                                </td>
                            </tr>
                        }
                        <tr>
                            <td>
                                <h2 className="widget__heading">
                                    <FormattedMessage id="patientsDuplicate.tableTitle" defaultMessage="Enregistrement" /> A:
                                </h2>
                            </td>
                            <td>
                                <h2 className="widget__heading">
                                    <FormattedMessage id="patientsDuplicate.tableTitle" defaultMessage="Enregistrement" /> B:
                                </h2>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <PatientInfos
                                    patient={patient}
                                    fixConflict={(key, value) => fixConflict(key, value)}
                                    conflicts={conflicts}
                                />
                            </td>
                            <td>
                                <PatientInfos
                                    patient={duplicatePatient}
                                    fixConflict={(key, value) => fixConflict(key, value)}
                                    conflicts={conflicts}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                {
                    patient.cases.map((caseItem, index) => {
                        const similarCase = duplicatePatient.cases[index] ? duplicatePatient.cases[index] : null;
                        return (
                            <section key={caseItem.id}>
                                <table className="no-style duplicate-table tests">
                                    <thead>
                                        <tr>
                                            <td>
                                                <h2 className="widget__heading">
                                                    <span className="case-id">
                                                        <span>Hat ID</span>: {caseItem.hat_id}
                                                    </span>
                                                </h2>
                                            </td>
                                            {
                                                similarCase &&
                                                <td>
                                                    <h2 className="widget__heading">
                                                        <span className="case-id">
                                                            <span>Hat ID</span>: {similarCase.hat_id}
                                                        </span>
                                                    </h2>
                                                </td>
                                            }
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <PatientCasesInfos
                                                    currentCase={caseItem}
                                                    similarCase={similarCase}
                                                />
                                            </td>
                                            <td className={similarCase ? '' : 'empty'}>
                                                <PatientCasesInfos
                                                    currentCase={similarCase}
                                                    similarCase={caseItem}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <PatientCasesLocation
                                                    currentCase={caseItem}
                                                    similarCase={similarCase}
                                                />
                                            </td>
                                            <td className={similarCase ? '' : 'empty'}>
                                                <PatientCasesLocation
                                                    currentCase={similarCase}
                                                    similarCase={caseItem}
                                                />
                                            </td>
                                        </tr>
                                        {
                                            caseItem.tests.map((t, testIndex) => {
                                                let similarTest;
                                                if (similarCase && similarCase.tests) {
                                                    similarTest = similarCase.tests[testIndex];
                                                }
                                                return (
                                                    <tr key={t.id}>
                                                        <td>
                                                            <PatientTestComponent
                                                                currentCase={caseItem}
                                                                test={t}
                                                                similarTest={similarTest}
                                                                testsMapping={testsMapping}
                                                            />
                                                        </td>
                                                        <td className={similarTest ? '' : 'empty'}>
                                                            <PatientTestComponent
                                                                currentCase={caseItem}
                                                                test={similarTest}
                                                                similarTest={t}
                                                                testsMapping={testsMapping}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        }
                                        {
                                            similarCase && (caseItem.tests.length < similarCase.tests.length) && // display extras test from similar case
                                            similarCase.tests.map((similarTest, similarIndex) => {
                                                if (!caseItem.tests[similarIndex]) {
                                                    return (
                                                        <tr key={similarTest.id}>
                                                            <td className="empty" />
                                                            <td>
                                                                <PatientTestComponent
                                                                    currentCase={caseItem}
                                                                    test={similarTest}
                                                                    similarTest={undefined}
                                                                    testsMapping={testsMapping}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                                return null;
                                            })
                                        }
                                    </tbody>
                                </table>
                            </section>
                        );
                    })
                }
                {
                    patient.cases.length < duplicatePatient.cases.length && // display extras cases from similar patient
                    duplicatePatient.cases.map((similarCase, similarCaseIndex) => {
                        if (!patient.cases[similarCaseIndex]) {
                            return (
                                <section key={similarCase.id}>
                                    <table className="no-style duplicate-table tests">
                                        <thead>
                                            <tr>
                                                <td className="empty" />
                                                <td>
                                                    <h2 className="widget__heading">
                                                        <span className="case-id">
                                                            <span>Hat ID</span>: {similarCase.hat_id} - <span>ID</span>: {similarCase.id}
                                                        </span>
                                                    </h2>
                                                </td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td />
                                                <td>
                                                    <PatientCasesInfos
                                                        currentCase={similarCase}
                                                        similarCase={null}
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td />
                                                <td>
                                                    <PatientCasesLocation
                                                        currentCase={similarCase}
                                                        similarCase={null}
                                                    />
                                                </td>
                                            </tr>
                                            {
                                                similarCase.tests.map(t => (
                                                    <tr key={t.id}>
                                                        <td />
                                                        <td>
                                                            <PatientTestComponent
                                                                test={t}
                                                                similarTest={null}
                                                                testsMapping={testsMapping}
                                                                currentCase={similarCase}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </section>
                            );
                        }
                        return null;
                    })
                }
            </section>
        );
    }
}


DuplicatePatientDetailsWrapper.defaultProps = {
    duplicatePatient: undefined,
    manualMerge: false,
};

DuplicatePatientDetailsWrapper.propTypes = {
    patient: PropTypes.object.isRequired,
    duplicatePatient: PropTypes.object,
    testsMapping: PropTypes.object.isRequired,
    manualMerge: PropTypes.bool,
    mergeDuplicates: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    fixConflict: PropTypes.func.isRequired,
    conflicts: PropTypes.array.isRequired,
};

const DuplicatePatientDetailsWrapperWithIntl = injectIntl(DuplicatePatientDetailsWrapper);

export default DuplicatePatientDetailsWrapperWithIntl;
