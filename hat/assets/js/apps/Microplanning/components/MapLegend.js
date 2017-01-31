import React, {Component, PropTypes} from 'react'
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl'

const MESSAGES = defineMessages({
  official: {
    id: 'microplanning.legend.official',
    defaultMessage: 'Villages from Z.S.'
  },
  other: {
    id: 'microplanning.legend.other',
    defaultMessage: 'Villages not from Z.S.'
  },
  unknown: {
    id: 'microplanning.tooltip.unknown',
    defaultMessage: 'Villages visible from satellite'
  }
})

class MapLegend extends Component {
  render () {
    const { legend, legendToggle } = this.props

    return (
      <div>
        <form className='widget__toggle-group'>
          <span className='widget__toggle-group__legend'>
            <FormattedMessage id='microplanning.display.villages.types' defaultMessage='Village types' />
          </span>
          { Object.keys(legend).map((key) => (
            <div
              key={key}
              onClick={() => legendToggle(key)}
              className={'widget__filter__item widget__filterplus__text ' + (legend[key] ? key : '')}>
              <i className={'fa fa' + (legend[key] ? '-check' : '') + '-square-o'} />
              <FormattedMessage {...MESSAGES[key]} />
            </div>
          )) }
        </form>

        <div className='legend'>
          <div className='points'>
            <span className='widget__toggle-group__legend'>
              <FormattedMessage id='microplanning.legend.key' defaultMessage='Map key' />
            </span>
            <ul className='legend__list'>
              <li key='highlight' className='legend__list__item'>
                <i className='map__legend__icon--highlight' />
                <FormattedMessage id='microplanning.legend.highlight' defaultMessage='Villages with confirmed cases in the indicated period' />
              </li>
              <li key='selected' className='legend__list__item'>
                <i className='map__legend__icon--selected' />
                <FormattedMessage id='microplanning.legend.selected' defaultMessage='Selected villages' />
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

MapLegend.propTypes = {
  legend: PropTypes.object,
  legendToggle: PropTypes.func
}

export default injectIntl(MapLegend)
