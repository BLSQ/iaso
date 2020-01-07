import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import { isCaseLocalised } from '../../../utils/index';

const gotoLocator = caseId => window.open(`/dashboard/locator/case_id/${caseId}`, '_blank');

const renderInfectionLocationRow = (currentCase, similarCase) => (

    <Fragment>
        {
            currentCase.infection_location_type
            && (
                <tr>
                    <th>
                        <FormattedMessage id="main.label.infectionLocation" defaultMessage="Infection location" />
                    </th>
                    <td
                        className={`${similarCase
                            && similarCase.infection_location_type
                            && (similarCase.infection_location_type !== currentCase.infection_location_type)
                            ? 'error'
                            : ''}`}
                    >
                        {currentCase.infection_location_type}
                    </td>
                </tr>
            )
        }
        {
            currentCase.infection_location
            && (
                <Fragment>
                    <tr>
                        <th>
                            <FormattedMessage id="main.label.infectionLocationProvince" defaultMessage="Infection province" />
                        </th>
                        <td
                            className={`${similarCase
                                && similarCase.infection_location
                                && (similarCase.infection_location.id !== currentCase.infection_location.id)
                                ? 'error'
                                : ''}`}
                        >
                            {currentCase.infection_location.province_name}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="main.label.infectionLocationZone" defaultMessage="Infection zone" />
                        </th>
                        <td
                            className={`${similarCase
                                && similarCase.infection_location
                                && (similarCase.infection_location.id !== currentCase.infection_location.id)
                                ? 'error'
                                : ''}`}
                        >
                            {currentCase.infection_location.ZS_name}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="main.label.infectionLocationArea" defaultMessage="Infection area" />
                        </th>
                        <td
                            className={`${similarCase
                                && similarCase.infection_location
                                && (similarCase.infection_location.id !== currentCase.infection_location.id)
                                ? 'error'
                                : ''}`}
                        >
                            {currentCase.infection_location.AS_name}
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <FormattedMessage id="main.label.infectionLocationVillage" defaultMessage="Infection village" />
                        </th>
                        <td
                            className={`${similarCase
                                && similarCase.infection_location
                                && (similarCase.infection_location.id !== currentCase.infection_location.id)
                                ? 'error'
                                : ''}`}
                        >
                            {currentCase.infection_location.name}
                        </td>
                    </tr>
                </Fragment>
            )
        }
    </Fragment>
);

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
                                    !isLocalised
                                    && (
                                        <div>
                                            <i className="fa fa-warning" />
                                            {'  '}
                                            <strong><FormattedMessage id="patientsCasesLocation.villageNotFound" defaultMessage="Location not found" /></strong>
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
                                    )
                                }
                                {
                                    isLocalised
                                    && <strong><FormattedMessage id="main.label.location" defaultMessage="Localisation" /></strong>
                                }
                            </th>
                        </tr>
                    </thead>
                    {
                        !isLocalised
                        && (
                            <tbody>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.province" defaultMessage="Province" />
                                    </th>
                                    <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.province !== currentCase.location.province)
                                        ? 'error' : ''} ${!currentCase.location || (currentCase.location && !currentCase.location.province) ? 'error-text' : ''}`}
                                    >
                                        {currentCase.location && currentCase.location.province ? currentCase.location.province : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.zone" defaultMessage="Health zone" />
                                    </th>
                                    <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.ZS !== currentCase.location.ZS)
                                        ? 'error' : ''} ${!currentCase.location || (currentCase.location && !currentCase.location.ZS) ? 'error-text' : ''}`}
                                    >
                                        {currentCase.location && currentCase.location.ZS ? currentCase.location.ZS : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.area" defaultMessage="Health area" />
                                    </th>
                                    <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.AS !== currentCase.location.AS)
                                        ? 'error' : ''} ${!currentCase.location.normalized.as ? 'error-text' : ''}`}
                                    >
                                        {currentCase.location && currentCase.location.AS ? currentCase.location.AS : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.village" defaultMessage="Village" />
                                    </th>
                                    <td className={`${similarCase && currentCase.location && similarCase.location && (similarCase.location.village !== currentCase.location.village)
                                        ? 'error' : ''} ${!currentCase.location.normalized.village ? 'error-text' : ''}`}
                                    >
                                        {currentCase.location && currentCase.location.village ? currentCase.location.village : '--'}
                                    </td>
                                </tr>
                                {renderInfectionLocationRow(currentCase, similarCase)}
                            </tbody>
                        )
                    }
                    {
                        isLocalised
                        && (
                            <tbody>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.province" defaultMessage="Province" />
                                    </th>
                                    <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.province_name !== currentCase.location.normalized.village.province_name) ? 'error' : ''}`}>
                                        {currentCase.location.normalized.village.province_name}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.zone" defaultMessage="Health zone" />
                                    </th>
                                    <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.ZS_name !== currentCase.location.normalized.village.ZS_name) ? 'error' : ''}`}>
                                        {currentCase.location.normalized.village.ZS_name}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.area" defaultMessage="Health area" />
                                    </th>
                                    <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.AS_name !== currentCase.location.normalized.village.AS_name) ? 'error' : ''}`}>
                                        {currentCase.location.normalized.village.AS_name}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.village" defaultMessage="Village" />
                                    </th>
                                    <td className={`${similarCase && similarCase.location.normalized && similarCase.location.normalized.village && (similarCase.location.normalized.village.name !== currentCase.location.normalized.village.name) ? 'error' : ''}`}>
                                        {currentCase.location.normalized.village.name}
                                    </td>
                                </tr>
                                {renderInfectionLocationRow(currentCase, similarCase)}
                            </tbody>
                        )
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
