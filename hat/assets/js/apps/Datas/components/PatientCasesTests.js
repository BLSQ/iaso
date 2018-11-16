import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

const MESSAGES = {
    positive: {
        defaultMessage: 'Positif',
        id: 'main.label.postive',
    },
    negative: {
        defaultMessage: 'Négatif',
        id: 'main.label.negative',
    },
    mobile_sync: {
        defaultMessage: 'Sync Tablette',
        id: 'main.label.mobile_sync',
    },
    mobile_backup: {
        defaultMessage: 'Backup Tablette',
        id: 'main.label.mobile_backup',
    },
    historic: {
        defaultMessage: 'Historique',
        id: 'main.label.historic',
    },
};

class PatientCasesTests extends React.Component {
    render() {
        const { tests } = this.props;
        return (
            <div className="patient-infos-container no-padding-left no-padding-top no-padding-right test-container">
                {
                    tests.map(t => (
                        <table key={t.id}>
                            <tbody>
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCasesTests.type" defaultMessage="Type de test" />
                                    </th>
                                    <td>
                                        {t.type ? t.type : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCasesTests.date" defaultMessage="Date" />
                                    </th>
                                    <td>
                                        {t.date ? moment(t.date).format('DD-MM-YYYY') : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCasesTests.date" defaultMessage="Date" />
                                    </th>
                                    <td>
                                        {t.date ? moment(t.date).format('HH:mm') : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCasesTests.result" defaultMessage="Résultat" />
                                    </th>
                                    <td>
                                        {t.result ? t.result : ''}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    ))
                }
            </div>
        );
    }
}


PatientCasesTests.propTypes = {
    tests: PropTypes.array.isRequired,
};

const PatientCasesTestsWithIntl = injectIntl(PatientCasesTests);

export default PatientCasesTestsWithIntl;
