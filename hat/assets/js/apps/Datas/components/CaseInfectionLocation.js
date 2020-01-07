import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';


class CaseInfectionLocation extends React.Component {
    render() {
        const {
            currentCase,
            toggleModal,
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
                                <span
                                    tabIndex={0}
                                    role="button"
                                    className="edit-button"
                                    onClick={() => toggleModal()}
                                >
                                    <i className="fa fa-edit" />
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>

                        {
                            currentCase.infection_location_type
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="main.label.infectionLocation" defaultMessage="Infection location" />
                                    </th>
                                    <td>
                                        {currentCase.infection_location_type_display}
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
                                        <td>
                                            {currentCase.infection_location.province_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="main.label.infectionLocationZone" defaultMessage="Infection zone" />
                                        </th>
                                        <td>
                                            {currentCase.infection_location.ZS_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="main.label.infectionLocationArea" defaultMessage="Infection area" />
                                        </th>
                                        <td>
                                            {currentCase.infection_location.AS_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage id="main.label.infectionLocationVillage" defaultMessage="Infection village" />
                                        </th>
                                        <td>
                                            {currentCase.infection_location.name}
                                        </td>
                                    </tr>
                                </Fragment>
                            )
                        }
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
};


export default CaseInfectionLocation;
