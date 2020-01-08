import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

const inputPlaceHolder = '--';

class CaseInfectionLocation extends React.Component {
    render() {
        const {
            currentCase,
            toggleModal,
            canEditPatientInfos,
        } = this.props;
        if (!currentCase) {
            return null;
        }
        return (
            <div className="patient-infos-container no-padding-left no-padding-top">

                <table
                    key={currentCase.id}
                >
                    <thead className="custom-head">
                        <tr>
                            <th colSpan="2">
                                <strong><FormattedMessage id="main.label.infectionLocationTitle" defaultMessage="Infection location" /></strong>
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
                    <tbody>

                        <tr>
                            <th>
                                <FormattedMessage id="main.label.infectionLocation" defaultMessage="Infection location" />
                            </th>
                            <td>
                                {currentCase.infection_location_type
                                    ? currentCase.infection_location_type_display
                                    : inputPlaceHolder
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.infectionLocationProvince" defaultMessage="Infection province" />
                            </th>
                            <td>
                                {currentCase.infection_location
                                    ? currentCase.infection_location.province_name
                                    : inputPlaceHolder
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.infectionLocationZone" defaultMessage="Infection zone" />
                            </th>
                            <td>
                                {currentCase.infection_location
                                    ? currentCase.infection_location.ZS_name
                                    : inputPlaceHolder
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.infectionLocationArea" defaultMessage="Infection area" />
                            </th>
                            <td>
                                {currentCase.infection_location
                                    ? currentCase.infection_location.AS_name
                                    : inputPlaceHolder
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.infectionLocationVillage" defaultMessage="Infection village" />
                            </th>
                            <td>
                                {currentCase.infection_location
                                    ? currentCase.infection_location.name
                                    : inputPlaceHolder
                                }
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}


CaseInfectionLocation.defaultProps = {
    currentCase: undefined,
};


CaseInfectionLocation.propTypes = {
    currentCase: PropTypes.object,
    toggleModal: PropTypes.func.isRequired,
    canEditPatientInfos: PropTypes.bool.isRequired,
};


export default CaseInfectionLocation;
