import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class PatientCasesLocation extends React.Component {
    render() {
        const { currentCase } = this.props;
        return (
            <div className="patient-infos-container no-padding-left no-padding-top">

                <table key={currentCase.id}>
                    <thead className="custom-head">
                        <tr>
                            <th colSpan="2">
                                <strong><FormattedMessage id="patientsCasesLocation.tableTitle" defaultMessage="Localisation" /></strong>
                            </th>
                        </tr>
                    </thead>
                    {
                        (!currentCase.location.normalized || !currentCase.location.normalized.village) &&
                        <tbody>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.province" defaultMessage="Province" />
                                </th>
                                <td>
                                    {currentCase.location && currentCase.location.province ? currentCase.location.province : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.ZS" defaultMessage="Zone de santé" />
                                </th>
                                <td>
                                    {currentCase.location && currentCase.location.ZS ? currentCase.location.ZS : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.AS" defaultMessage="Aire de santé" />
                                </th>
                                <td>
                                    {currentCase.location && currentCase.location.AS ? currentCase.location.AS : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.village" defaultMessage="Village" />
                                </th>
                                <td>
                                    {currentCase.location && currentCase.location.village ? currentCase.location.village : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th />
                                <td className="error">
                                    <FormattedMessage id="patientsCasesLocation.village" defaultMessage="Non trouvé" />
                                </td>
                            </tr>
                        </tbody>
                    }
                    {
                        (currentCase.location.normalized && currentCase.location.normalized.village) &&
                        <tbody>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.province" defaultMessage="Province" />
                                </th>
                                <td>
                                    {currentCase.location.normalized.village.province_name}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.ZS" defaultMessage="Zone de santé" />
                                </th>
                                <td>
                                    {currentCase.location.normalized.village.ZS_name}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.AS" defaultMessage="Aire de santé" />
                                </th>
                                <td>
                                    {currentCase.location.normalized.village.AS_name}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.village" defaultMessage="Village" />
                                </th>
                                <td>
                                    {currentCase.location.normalized.village.name}
                                </td>
                            </tr>
                        </tbody>
                    }
                </table>
            </div>
        );
    }
}


PatientCasesLocation.propTypes = {
    currentCase: PropTypes.object.isRequired,
};

const PatientCasesInfoWithIntl = injectIntl(PatientCasesLocation);

export default PatientCasesInfoWithIntl;
