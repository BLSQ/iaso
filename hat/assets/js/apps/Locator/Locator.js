/*
 * The Microplanning component is responsible of the micro-planning process
 *
 * It has a few behaviors:
 * - load and filter data
 * - display the map
 * - execute the selection actions
 * - export to Excel the selected list
 * - print/export map view
 *
  */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl, intlShape } from 'react-intl'
import Select from 'react-select';
import ReactModal from 'react-modal';
import {villageFiltersActions} from './redux/villageFilters'
import {caseActions} from './redux/case'
import Case from './components/Case'
import Filters from './components/Filters'

const request = require('superagent');

import LoadingSpinner from '../../components/loading-spinner';
import { createUrl } from '../../utils/fetchData';


import {
  Map
} from './components';
import { selectionActions } from '../Microplanning/redux/selection'

const MESSAGES = defineMessages({
  'locator-example': {
    defaultMessage: 'Example',
    id: 'locator.labels.example'
  }
})

export class Locator extends Component {
  constructor(props) {
    super(props)
  }

  componentWillReceiveProps(nextProps) {
  }

  render () {

    let legend = {YES: true}
    let baseLayer = 'arcgis-topo'
    let overlays = {labels: false}

    return <div className="locator-container">

      {this.props.kase && <div className="locator-control-div">
        <Case case={this.props.kase}></Case>
        <Filters filters={this.props.villageFilters}
                 selectProvince={this.props.selectProvince}
                 selectZone={this.props.selectZone}
                 selectArea={this.props.selectArea}
                 selectVillage={this.props.selectVillage}
        />
      </div>}
      {!this.props.kase && <div>Plus de cas à traiter!!!!!</div>}
      <div className='locator-map'>
        <Map
          baseLayer={baseLayer}
          overlays={overlays}
          legend={legend}
          villages={this.props.villageFilters.villages}
        />
      </div>
    </div>
  }
}

/*
  baseLayer: PropTypes.string,
  overlays: PropTypes.object,
  items: PropTypes.arrayOf(PropTypes.object),
  selectionAction: PropTypes.func,
  chosenItem: PropTypes.object,
  showItem: PropTypes.func,
  leafletMap: PropTypes.func,
  intl: intlShape.isRequired,
 */

Locator.propTypes = {
    villageFilters: PropTypes.object,
    kase: PropTypes.object,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired
};

const LocatorWithIntl = injectIntl(Locator);
const MapDispatchToProps = dispatch => ({
    loadAreas: areas => dispatch(villageFiltersActions.loadAreas(areas))
});

const MapStateToProps = state => ({
  villageFilters: state.villageFilters,
  kase: state.kase
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
