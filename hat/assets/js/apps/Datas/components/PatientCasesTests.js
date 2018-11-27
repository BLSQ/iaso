import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

class PatientCasesTests extends React.Component {
    render() {
        const { tests, testsMapping, similarCase } = this.props;
        return (
            <div className="patient-infos-container no-padding-left no-padding-top no-padding-right test-container">
                {
                    tests.map((t, index) => {
                        let similarTest;
                        if (similarCase && similarCase.tests) {
                            similarTest = similarCase.tests[index];
                        }
                        return (
                            <table key={t.id}>
                                <thead className="custom-head">
                                    <tr>
                                        <th colSpan="2">
                                            {
                                                t.type && (t.type === 'CATT' || t.type === 'RDT') &&
                                                <strong><FormattedMessage id="patientsCasesTests.screening" defaultMessage="Dépistage" /></strong>
                                            }
                                            {
                                                t.type && (t.type !== 'CATT' && t.type !== 'RDT') &&
                                                <strong><FormattedMessage id="patientsCasesTests.confirmation" defaultMessage="Confirmation" /></strong>
                                            }
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="patientsCasesTests.type" defaultMessage="Type de test" />
                                        </th>
                                        <td className={`${similarTest && (similarTest.type !== t.type) ? 'error' : ''}`}>
                                            {t.type ? t.type : '--'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="patientsCasesTests.date" defaultMessage="Date" />
                                        </th>
                                        <td className={`${t.date && similarTest && similarTest.date && (moment(similarTest.date).format('DD-MM-YYYY') !== moment(t.date).format('DD-MM-YYYY')) ? 'error' : ''}`}>
                                            {t.date ? moment(t.date).format('DD-MM-YYYY') : '--'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="patientsCasesTests.hour" defaultMessage="Heure" />
                                        </th>
                                        <td className={`${t.date && similarTest && similarTest.date && (moment(similarTest.date).format('HH:mm') !== moment(t.date).format('HH:mm')) ? 'error' : ''}`}>
                                            {t.date ? moment(t.date).format('HH:mm') : '--'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="patientsCasesTests.result" defaultMessage="Résultat" />
                                        </th>
                                        <td className={`${similarTest && (similarTest.result !== t.result) ? 'error' : ''}`}>
                                            {t.result && testsMapping[t.result] ? testsMapping[t.result] : ''}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        );
                    })
                }
            </div>
        );
    }
}


PatientCasesTests.defaultProps = {
    similarCase: undefined,
};


PatientCasesTests.propTypes = {
    tests: PropTypes.array.isRequired,
    testsMapping: PropTypes.object.isRequired,
    similarCase: PropTypes.object,
};

const PatientCasesTestsWithIntl = injectIntl(PatientCasesTests);

export default PatientCasesTestsWithIntl;
