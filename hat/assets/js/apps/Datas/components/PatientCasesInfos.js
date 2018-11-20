import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

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
    pv: {
        defaultMessage: 'Pharmacovigilance',
        id: 'main.label.pv',
    },
};

class PatientCasesInfo extends React.Component {
    render() {
        const { currentCase } = this.props;
        const { formatMessage } = this.props.intl;
        return (
            <div className="patient-infos-container no-padding-left no-padding-top">
                <table key={currentCase.id}>
                    <thead className="custom-head">
                        <tr>
                            <th colSpan="2">
                                <strong><FormattedMessage id="patientsCases.tableTitle" defaultMessage="Informations" /></strong>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.team" defaultMessage="Equipe" />
                            </th>
                            <td>
                                {
                                    currentCase.team.normalized_team ? currentCase.team.normalized_team.name : null
                                }
                                {
                                    !currentCase.team.normalized_team && currentCase.mobile_unit ? currentCase.mobile_unite : null
                                }
                                {
                                    !currentCase.team.normalized_team && !currentCase.mobile_unit ? '--' : null
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.form_number" defaultMessage="N° de formulaire" />
                            </th>
                            <td>{currentCase.form_number ? currentCase.form_number : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.form_year" defaultMessage="Année de formulaire" />
                            </th>
                            <td>{currentCase.form_year ? currentCase.form_year : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.source" defaultMessage="Source" />
                            </th>
                            <td>
                                {currentCase.source && MESSAGES[currentCase.source] ?
                                    formatMessage(MESSAGES[currentCase.source])
                                    : currentCase.source}
                                {!currentCase.source && '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.device.last_user" defaultMessage="Utilisateur tablette" />
                            </th>
                            <td>
                                {currentCase.device ? currentCase.device.last_user : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.device.last_team" defaultMessage="Equipe tablette" />
                            </th>
                            <td>
                                {currentCase.device ? currentCase.device.last_team : '--'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}


PatientCasesInfo.propTypes = {
    currentCase: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const PatientCasesWithIntl = injectIntl(PatientCasesInfo);

export default PatientCasesWithIntl;
