import React from 'react'
import PropTypes from 'prop-types';

class Case extends React.Component {
  render()
  {
    let kase = this.props.case.case;
    if (kase)
    return <div>
      <table>
      <thead><tr><th colSpan="2">Données rapportées</th></tr></thead>
      <tbody>
      <tr><th>Source</th><td>{kase.source}</td></tr>
      <tr><th>Année</th><td>{kase.form_year}</td></tr>
      <tr><th>Numéro de formulaire</th><td>{kase.form_number}</td></tr>
      <tr><th>Unité</th><td>{kase.mobile_unit}</td></tr>
      <tr><th>Prénom</th><td>{kase.name}</td></tr>
      <tr><th>Prénom</th><td>{kase.name}</td></tr>
      <tr><th>Nom</th><td>{kase.lastname}</td></tr>
      <tr><th>Postnom</th><td>{kase.prename}</td></tr>
      <tr><th>Province</th><td>{kase.province}</td></tr>
      <tr><th>ZS</th><td>{kase.ZS}</td></tr>
      <tr><th>AS</th><td>{kase.AS}</td></tr>
      <tr><th>Village</th><td>{kase.village}</td></tr>
      </tbody>
    </table>
    </div>
    else
      return <div></div>
  }

}


Case.propTypes = {
  case: PropTypes.object.isRequired
}

export default Case