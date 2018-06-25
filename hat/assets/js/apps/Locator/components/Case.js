import React from 'react';
import PropTypes from 'prop-types';

class Case extends React.Component {
    render() {
        return (
            <div className="locator-case-container">
                <table>
                    <thead><tr><th colSpan="2">Données rapportées</th></tr></thead>
                    <tbody>
                        <tr><th>Source</th><td>{this.props.case.source ? this.props.case.source : '--'}</td></tr>
                        <tr><th>Année</th><td>{this.props.case.form_year ? this.props.case.form_year : '--'}</td></tr>
                        <tr><th>N° de formulaire</th><td>{this.props.case.form_number ? this.props.case.form_number : '--'}</td></tr>
                        <tr><th>Unité</th><td>{this.props.case.mobile_unit ? this.props.case.mobile_unit : '--'}</td></tr>
                        <tr><th>Prénom</th><td>{this.props.case.name ? this.props.case.name : '--'}</td></tr>
                        <tr><th>Nom</th><td>{this.props.case.lastname ? this.props.case.lastname : '--'}</td></tr>
                        <tr><th>Postnom</th><td>{this.props.case.prename ? this.props.case.prename : '--'}</td></tr>
                        <tr><th>Province</th><td>{this.props.case.province ? this.props.case.province : '--'}</td></tr>
                        <tr><th>ZS</th><td>{this.props.case.ZS ? this.props.case.ZS : '--'}</td></tr>
                        <tr><th>AS</th><td>{this.props.case.AS ? this.props.case.AS : '--'}</td></tr>
                        <tr><th>Village</th><td>{this.props.case.village ? this.props.case.village : '--'}</td></tr>
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
