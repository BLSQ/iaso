import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class PatientInfos extends React.Component {
    render() {
        const { patient } = this.props;
        const { formatMessage } = this.props.intl;
        return (
            <div className="patient-infos-container no-padding-right">
                <table>
                    <thead className="custom-head">
                        <tr>
                            <th colSpan="2">
                                <strong><FormattedMessage id="patientsCasesLocation.tableTitle" defaultMessage="Patient" /></strong>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.last_name" defaultMessage="Nom" />
                            </th>
                            <td>{patient.last_name ? patient.last_name : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.post_name" defaultMessage="Postnom" />
                            </th>
                            <td>{patient.post_name ? patient.post_name : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.first_name" defaultMessage="Prénom" />
                            </th>
                            <td>{patient.first_name ? patient.first_name : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.mothers_surname" defaultMessage="Nom de la mère" />
                            </th>
                            <td>{patient.mothers_surname ? patient.mothers_surname : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.sex" defaultMessage="Sexe" />
                            </th>
                            <td>
                                {
                                    patient.sex === 'female' &&
                                    formatMessage({
                                        defaultMessage: 'Femme',
                                        id: 'main.label.female',
                                    })
                                }
                                {
                                    patient.sex === 'male' &&
                                    formatMessage({
                                        defaultMessage: 'Homme',
                                        id: 'main.label.male',
                                    })
                                }
                                {
                                    patient.sex !== 'male' && patient.sex !== 'female' &&
                                    '--'
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.age" defaultMessage="Age" />
                            </th>
                            <td>{patient.age ? patient.age : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.province" defaultMessage="Province d'origine" />
                            </th>
                            <td>{patient.province ? patient.province : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.zone" defaultMessage="Zone d'origine" />
                            </th>
                            <td>{patient.ZS ? patient.ZS : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.area" defaultMessage="Aire d'origine" />
                            </th>
                            <td>{patient.AS ? patient.AS : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.village" defaultMessage="Village d'origine" />
                            </th>
                            <td>{patient.village ? patient.village : '--'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}


PatientInfos.propTypes = {
    patient: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const PatientInfosWithIntl = injectIntl(PatientInfos);

export default PatientInfosWithIntl;
