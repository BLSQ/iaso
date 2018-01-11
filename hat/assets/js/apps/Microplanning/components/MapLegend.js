/*
 * This component contains the list of possible map markers and allows
 * in some cases to show/hide them.
 * (This could have also been represented as a map overlay)
 *
 * In our case,
 *
 * The markers are the village types divided as:
 * 'YES': Villages from Z.S.
 * 'NO': Villages not from Z.S.
 * 'OTHER': Locations where people are found during campaigns
 * 'NA': Villages from satellite (unknown)
 * Default values are all empty, except for types, where the default values is "YES"
 *
 * Other entries are:
 * - `selected`: Selected villages
 * - `highlight`: Highlighted villages (based on filters)
 *
 * The list of possible options is included in the `map` redux file.
 * If the list is updated this files should be updated too,
 * adding new entries in the MESSAGES list with the pertinent labels.
 * The MESSAGE entry keys and the lengend keys MUST match.
 */

import React, {Component, PropTypes} from 'react'
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl'

const MESSAGES = defineMessages({
  YES: {
    id: 'microplanning.legend.official',
    defaultMessage: 'Villages from Z.S.'
  },
  NO: {
    id: 'microplanning.legend.notofficial',
    defaultMessage: 'Villages not from Z.S.'
  },
  OTHER: {
    id: 'microplanning.legend.other',
    defaultMessage: 'Locations where people are found during campaigns'
  },
  NA: {
    id: 'microplanning.legend.unknown',
    defaultMessage: 'Villages visible from satellite'
  },

  selected: {
    id: 'microplanning.legend.selected',
    defaultMessage: 'Selected villages'
  },
  highlight: {
    id: 'microplanning.legend.highlight',
    defaultMessage: 'Villages with confirmed HAT cases'
  },

  // actions
  show: {
    id: 'microplanning.legend.show',
    defaultMessage: 'Show'
  },
  hide: {
    id: 'microplanning.legend.hide',
    defaultMessage: 'Hide'
  }
})

class MapLegend extends Component {
  render () {
    const {legend, toggle} = this.props
    const fixedItems = [ 'selected', 'highlight' ]

    return (
      <div className='map__option'>
        <span className='map__option__header'>
          <FormattedMessage id='microplanning.legend.key' defaultMessage='Map key' />
        </span>
        <form>
          <ul className='map__option__list'>
            { Object.keys(legend).map((key) => (
              <li key={key} className='map__option__list__item'>
                <i className={'map__option__icon--' + key} />
                <FormattedMessage {...MESSAGES[key]} />
                <span onClick={() => toggle(key)} className='map__option__action'>
                  <FormattedMessage {...MESSAGES[(legend[key] ? 'hide' : 'show')]} />
                </span>
              </li>
            )) }
            { fixedItems.map((key) => (
              <li key={key} className='map__option__list__item'>
                <i className={'map__option__icon--' + key} />
                <FormattedMessage {...MESSAGES[key]} />
              </li>
            ))}
          </ul>
        </form>
      </div>
    )
  }
}

MapLegend.propTypes = {
  legend: PropTypes.object,
  toggle: PropTypes.func
}

export default injectIntl(MapLegend)
