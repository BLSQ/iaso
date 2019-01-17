import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class PatientInfos extends React.Component {
    render() {
        const { patient, duplicatePatient } = this.props;
        const { formatMessage } = this.props.intl;
        return (
            <div className={`patient-infos-container no-padding-right ${duplicatePatient ? 'padding-bottom' : ''}`}>
                <table className={duplicatePatient ? 'margin-bottom' : ''}>
                    <tbody>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.last_name" defaultMessage="Nom" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.last_name.toLowerCase() !== patient.last_name.toLowerCase()) ? 'error' : ''}`}>
                                {patient.last_name ? patient.last_name : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.post_name" defaultMessage="Postnom" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.post_name.toLowerCase() !== patient.post_name.toLowerCase()) ? 'error' : ''}`}>
                                {patient.post_name ? patient.post_name : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.first_name" defaultMessage="Prénom" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.first_name.toLowerCase() !== patient.first_name.toLowerCase()) ? 'error' : ''}`}>
                                {patient.first_name ? patient.first_name : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.mothers_surname" defaultMessage="Nom de la mère" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.mothers_surname.toLowerCase() !== patient.mothers_surname.toLowerCase()) ? 'error' : ''}`}>
                                {patient.mothers_surname ? patient.mothers_surname : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.sex" defaultMessage="Sexe" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.sex !== patient.sex) ? 'error' : ''}`}>

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
                            <td className={`${duplicatePatient && (duplicatePatient.age !== patient.age) ? 'error' : ''}`}>
                                {patient.age ? patient.age : '--'} {patient.year_of_birth ? `(${patient.year_of_birth})` : ''}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.province" defaultMessage="Province d'origine" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.province !== patient.province) ? 'error' : ''}`}>
                                {patient.province ? patient.province : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.zone" defaultMessage="Zone d'origine" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.ZS !== patient.ZS) ? 'error' : ''}`}>
                                {patient.ZS ? patient.ZS : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.area" defaultMessage="Aire d'origine" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.AS !== patient.AS) ? 'error' : ''}`}>
                                {patient.AS ? patient.AS : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsinfos.village" defaultMessage="Village d'origine" />
                            </th>
                            <td className={`${duplicatePatient && (duplicatePatient.village !== patient.village) ? 'error' : ''}`}>
                                {patient.village ? patient.village : '--'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

PatientInfos.defaultProps = {
    duplicatePatient: undefined,
};

PatientInfos.propTypes = {
    patient: PropTypes.object.isRequired,
    duplicatePatient: PropTypes.object,
    intl: PropTypes.object.isRequired,
};

const PatientInfosWithIntl = injectIntl(PatientInfos);

export default PatientInfosWithIntl;
