import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

class Case extends React.Component {
    render() {
        let currentTeam = '--';
        if (this.props.case.team) {
            if (this.props.case.team.normalized_team) {
                currentTeam = this.props.case.team.normalized_team.name;
            } else if (this.props.case.team.mobile_unit) {
                currentTeam = this.props.case.team.mobile_unit;
            }
        }
        return (
            <div className="locator-case-container">
                <table>
                    <thead>
                        <tr>
                            <th colSpan="2">
                                <FormattedMessage id="locator.label.case-container.title" defaultMessage="Reported data" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.source" defaultMessage="Source" />
                            </th>
                            <td>{this.props.case.source ? this.props.case.source : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.year" defaultMessage="Année" />
                            </th>
                            <td>{this.props.case.form_year ? this.props.case.form_year : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.form_number" defaultMessage="Form number" />
                            </th>
                            <td>{this.props.case.form_number ? this.props.case.form_number : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="microplanning.label.team" defaultMessage="Team" />
                            </th>
                            <td>{currentTeam}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.name" defaultMessage="Name" />
                            </th>
                            <td>{this.props.case.patient.last_name ? this.props.case.patient.last_name : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.postName" defaultMessage="Post name" />
                            </th>
                            <td>{this.props.case.patient.post_name ? this.props.case.patient.post_name : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.firstName" defaultMessage="First name" />
                            </th>
                            <td>{this.props.case.patient.first_name ? this.props.case.patient.first_name : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.province" defaultMessage="Province" />
                            </th>
                            <td>{this.props.case.location.province ? this.props.case.location.province : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                ZS
                            </th>
                            <td>{this.props.case.location.ZS ? this.props.case.location.ZS : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                AS
                            </th>
                            <td>{this.props.case.location.AS ? this.props.case.location.AS : '--'}</td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.village" defaultMessage="Village" />
                            </th>
                            <td>{this.props.case.location.village ? this.props.case.location.village : '--'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}


Case.propTypes = {
    case: PropTypes.object.isRequired,
};

export default Case;
