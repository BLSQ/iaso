import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { isCaseLocalised } from '../../../utils/index';


class CaseInfoLocation extends React.Component {
    render() {
        const {
            currentCase,
            toggleModal,
            canEditPatientInfos,
        } = this.props;
        if (!currentCase) {
            return null;
        }
        const isLocalised = isCaseLocalised(currentCase);
        return (
            <div className="patient-infos-container no-padding-left no-padding-top">

                <table
                    key={currentCase.id}
                >
                    <thead className="custom-head">
                        <tr>
                            <th colSpan="2">
                                <strong><FormattedMessage id="main.label.location" defaultMessage="Localisation" /></strong>
                                {
                                    canEditPatientInfos
                                    && (
                                        <span
                                            tabIndex={0}
                                            role="button"
                                            className="edit-button"
                                            onClick={() => toggleModal()}
                                        >
                                            <i className="fa fa-edit" />
                                        </span>
                                    )
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
                                    <td>
                                        {currentCase.location && currentCase.location.province ? currentCase.location.province : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.zone" defaultMessage="Health zone" />
                                    </th>
                                    <td>
                                        {currentCase.location && currentCase.location.ZS ? currentCase.location.ZS : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.area" defaultMessage="Health area" />
                                    </th>
                                    <td>
                                        {currentCase.location && currentCase.location.AS ? currentCase.location.AS : '--'}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.village" defaultMessage="Village" />
                                    </th>
                                    <td>
                                        {currentCase.location && currentCase.location.village ? currentCase.location.village : '--'}
                                    </td>
                                </tr>
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
                                    <td>
                                        {currentCase.location.normalized.village.province_name}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.zone" defaultMessage="Health zone" />
                                    </th>
                                    <td>
                                        {currentCase.location.normalized.village.ZS_name}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.area" defaultMessage="Health area" />
                                    </th>
                                    <td>
                                        {currentCase.location.normalized.village.AS_name}
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.village" defaultMessage="Village" />
                                    </th>
                                    <td>
                                        {currentCase.location.normalized.village.name}
                                    </td>
                                </tr>
                            </tbody>
                        )
                    }
                </table>
            </div>
        );
    }
}


CaseInfoLocation.defaultProps = {
    currentCase: undefined,
};


CaseInfoLocation.propTypes = {
    currentCase: PropTypes.object,
    toggleModal: PropTypes.func.isRequired,
    canEditPatientInfos: PropTypes.bool.isRequired,
};

export default CaseInfoLocation;
