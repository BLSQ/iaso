import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';
import {
    treatmentsMedecineMessages,
    incompleteReasonsMessages,
    treatmentsEventsMessages,
} from '../../../utils/constants/treatmentsMessages';

class TreatmentComponent extends React.Component {
    render() {
        const { treatment } = this.props;
        const { formatMessage } = this.props.intl;
        return (
            <table>
                <tbody>
                    <tr>
                        <th>
                            ID
                        </th>
                        <td>
                            {treatment.id}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.medeicine" defaultMessage="Médicament" />
                        </th>
                        <td>
                            {treatment.medicine && treatmentsMedecineMessages[treatment.medicine] ?
                                formatMessage(treatmentsMedecineMessages[treatment.medicine])
                                : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.start_date" defaultMessage="Date de début" />
                        </th>
                        <td>
                            {treatment.start_date ? moment(treatment.start_date).format('DD-MM-YYYY') : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.end_date" defaultMessage="Date de fin" />
                        </th>
                        <td>
                            {treatment.end_date ? moment(treatment.end_date).format('DD-MM-YYYY') : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.issues" defaultMessage="Evenements indésirables" />
                        </th>
                        <td>
                            {
                                treatment.issues.length > 0 &&
                                <ul>
                                    {
                                        treatment.issues.map((i, index) =>
                                            (
                                                <li key={`${i}-${index}`}>
                                                    {
                                                        treatmentsEventsMessages[i] ? `${formatMessage(treatmentsEventsMessages[i])} ` : ''
                                                    }
                                                </li>
                                            ))
                                    }
                                </ul>
                            }
                            {
                                treatment.issues.length === 0 && '--'
                            }
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.complete" defaultMessage="Terminé" />
                        </th>
                        <td>
                            {treatment.complete ?
                                <i className="fa fa-check-square success-text" />
                                :
                                <i className="fa fa-times error-text" />}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patient.treatment.incomplete_reasons" defaultMessage="Cause de l'incomplétude" />
                        </th>
                        <td>
                            {
                                treatment.incomplete_reasons.length > 0 &&
                                <ul>
                                    {
                                        treatment.incomplete_reasons.map((r, index) =>
                                            (
                                                <li key={`${r}-${index}`}>
                                                    {
                                                        incompleteReasonsMessages[r] ? `${formatMessage(incompleteReasonsMessages[r])} ` : ''
                                                    }
                                                </li>
                                            ))
                                    }
                                </ul>
                            }
                            {
                                treatment.incomplete_reasons.length === 0 && '--'
                            }
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patientsCases.device.last_user" defaultMessage="Utilisateur tablette" />
                        </th>
                        <td>
                            {treatment.device && treatment.device.last_user ? treatment.device.last_user : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patientsCases.device.last_team" defaultMessage="Equipe tablette" />
                        </th>
                        <td>
                            {treatment.device && treatment.device.last_team ? treatment.device.last_team : '--'}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="patientsCases.device.id" defaultMessage="Tablette id" />
                        </th>
                        <td>
                            {treatment.device && treatment.device.device_id ? treatment.device.device_id : '--'}
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

TreatmentComponent.propTypes = {
    treatment: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const TreatmentComponentWithIntl = injectIntl(TreatmentComponent);

export default TreatmentComponentWithIntl;
