import React from 'react'
import PropTypes from 'prop-types';

class Case extends React.Component {
  render()
  {
    let cases = this.props.case.cases;
    if (cases && cases.length==1) {
      let kase = cases[0]
      return <div>
        <table>
        <thead><tr><th colSpan="2">Données rapportées</th></tr></thead>
        <tbody>
        <tr><th>Source</th><td>{kase.source ? kase.source : '--'}</td></tr>
        <tr><th>Année</th><td>{kase.form_year ? kase.form_year : '--'}</td></tr>
        <tr><th>N° de formulaire</th><td>{kase.form_number ? kase.form_number : '--'}</td></tr>
        <tr><th>Unité</th><td>{kase.mobile_unit ? kase.mobile_unit : '--'}</td></tr>
        <tr><th>Prénom</th><td>{kase.name ? kase.name : '--'}</td></tr>
        <tr><th>Nom</th><td>{kase.lastname ? kase.lastname : '--'}</td></tr>
        <tr><th>Postnom</th><td>{kase.prename ? kase.prename : '--'}</td></tr>
        <tr><th>Province</th><td>{kase.province ? kase.province : '--'}</td></tr>
        <tr><th>ZS</th><td>{kase.ZS ? kase.ZS : '--'}</td></tr>
        <tr><th>AS</th><td>{kase.AS ? kase.AS : '--'}</td></tr>
        <tr><th>Village</th><td>{kase.village ? kase.village : '--'}</td></tr>
        </tbody>
      </table>
      </div>
    }
    else
      return <div></div>
  }

}


Case.propTypes = {
  case: PropTypes.object.isRequired
}

export default Case