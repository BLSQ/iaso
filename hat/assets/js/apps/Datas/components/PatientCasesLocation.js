import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class PatientCasesLocation extends React.Component {
    render() {
        const { currentCase, similarCase } = this.props;
        if (!currentCase) {
            return null;
        }
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
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.province !== currentCase.location.province) ? 'error' : ''}`}>
                                    {currentCase.location && currentCase.location.province ? currentCase.location.province : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.ZS" defaultMessage="Zone de santé" />
                                </th>
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.ZS !== currentCase.location.ZS) ? 'error' : ''}`}>
                                    {currentCase.location && currentCase.location.ZS ? currentCase.location.ZS : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.AS" defaultMessage="Aire de santé" />
                                </th>
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.AS !== currentCase.location.AS) ? 'error' : ''}`}>
                                    {currentCase.location && currentCase.location.AS ? currentCase.location.AS : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.village" defaultMessage="Village" />
                                </th>
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.village !== currentCase.location.village) ? 'error' : ''}`}>
                                    {currentCase.location && currentCase.location.village ? currentCase.location.village : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th />
                                <td className="error">
                                    <FormattedMessage id="patientsCasesLocation.villageNotFound" defaultMessage="Non trouvé" />
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
                                <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.province_name !== currentCase.location.normalized.village.province_name) ? 'error' : ''}`}>
                                    {currentCase.location.normalized.village.province_name}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.ZS" defaultMessage="Zone de santé" />
                                </th>
                                <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.ZS_name !== currentCase.location.normalized.village.ZS_name) ? 'error' : ''}`}>
                                    {currentCase.location.normalized.village.ZS_name}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.AS" defaultMessage="Aire de santé" />
                                </th>
                                <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.AS_name !== currentCase.location.normalized.village.AS_name) ? 'error' : ''}`}>
                                    {currentCase.location.normalized.village.AS_name}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.village" defaultMessage="Village" />
                                </th>
                                <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.name !== currentCase.location.normalized.village.name) ? 'error' : ''}`}>
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


PatientCasesLocation.defaultProps = {
    similarCase: undefined,
    currentCase: undefined,
};


PatientCasesLocation.propTypes = {
    currentCase: PropTypes.object,
    similarCase: PropTypes.object,
};

const PatientCasesInfoWithIntl = injectIntl(PatientCasesLocation);

export default PatientCasesInfoWithIntl;
