import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import { isCaseLocalised } from '../../../utils/index';

const gotoLocator = case_id => window.open(`/dashboard/locator/case_id/${case_id}`, '_blank');

class PatientCasesLocation extends React.Component {
    render() {
        const {
            currentCase,
            similarCase,
            intl: {
                formatMessage,
            },
        } = this.props;
        if (!currentCase) {
            return null;
        }
        const isLocalised = isCaseLocalised(currentCase);
        return (
            <div className="patient-infos-container no-padding-left no-padding-top">

                <table
                    key={currentCase.id}
                    className={!isLocalised ? 'error-table' : ''}
                >
                    <thead className="custom-head">
                        <tr
                            className={!isLocalised ? 'error' : ''}
                        >
                            <th colSpan="2">
                                {
                                    !isLocalised &&
                                    <div>
                                        <i className="fa fa-warning" /> {'  '}
                                        <strong><FormattedMessage id="patientsCasesLocation.villageNotFound" defaultMessage="Localisation non trouvée" /></strong>
                                        <button
                                            className="button--tiny"
                                            onClick={() => gotoLocator(currentCase.id)}
                                        >
                                            <i className="fa fa-thumb-tack" />
                                            {formatMessage({
                                                defaultMessage: 'Localiser',
                                                id: 'main.label.locateCase',
                                            })}
                                        </button>
                                    </div>
                                }
                                {
                                    isLocalised &&
                                    <strong><FormattedMessage id="patientsCasesLocation.tableTitle" defaultMessage="Localisation" /></strong>
                                }

                            </th>
                        </tr>
                    </thead>
                    {
                        !isLocalised &&
                        <tbody>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.province" defaultMessage="Province" />
                                </th>
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.province !== currentCase.location.province)
                                    ? 'error' : ''} ${!currentCase.location || (currentCase.location && !currentCase.location.province) ? 'error-text' : ''}`}
                                >
                                    {currentCase.location && currentCase.location.province ? currentCase.location.province : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.ZS" defaultMessage="Zone de santé" />
                                </th>
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.ZS !== currentCase.location.ZS) ?
                                    'error' : ''} ${!currentCase.location || (currentCase.location && !currentCase.location.ZS) ? 'error-text' : ''}`}
                                >
                                    {currentCase.location && currentCase.location.ZS ? currentCase.location.ZS : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.AS" defaultMessage="Aire de santé" />
                                </th>
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.AS !== currentCase.location.AS) ?
                                    'error' : ''} ${!currentCase.location.normalized.as ? 'error-text' : ''}`}
                                >
                                    {currentCase.location && currentCase.location.AS ? currentCase.location.AS : '--'}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage id="patientsCasesLocation.village" defaultMessage="Village" />
                                </th>
                                <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.village !== currentCase.location.village) ?
                                    'error' : ''} ${!currentCase.location.normalized.village ? 'error-text' : ''}`}
                                >
                                    {currentCase.location && currentCase.location.village ? currentCase.location.village : '--'}
                                </td>
                            </tr>
                        </tbody>
                    }
                    {
                        isLocalised &&
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
    intl: PropTypes.object.isRequired,
};

const PatientCasesInfoWithIntl = injectIntl(PatientCasesLocation);

export default PatientCasesInfoWithIntl;
