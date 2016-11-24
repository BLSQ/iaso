import React, {Component, PropTypes} from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'

class MapLegend extends Component {
  render () {
    const { legend, legendChange } = this.props

    return (
      <div>
        <form className='widget__toggle-group'>
          <span className='widget__toggle-group__legend'>
            <FormattedMessage id='microplanning.display.villages.types' defaultMessage='Village types' />
          </span>
          <label htmlFor='official' className='widget__filterpluslabel__item--official'>
            <input type='checkbox' name='official' checked={legend.official} onChange={legendChange} className='widget__filterpluslabel__input' />
            <span className='widget__filterpluslabel__text--official'>
              <FormattedMessage id='microplanning.display.official' defaultMessage='Official villages' />
            </span>
          </label>
          <label htmlFor='other' className='widget__filterpluslabel__item--other'>
            <input type='checkbox' name='other' checked={legend.other} onChange={legendChange} className='widget__filterpluslabel__input' />
            <span className='widget__filterpluslabel__text--other'>
              <FormattedMessage id='microplanning.display.other' defaultMessage='Non official villages' />
            </span>
          </label>
          <label htmlFor='unknown' className='widget__filterpluslabel__item--unknown'>
            <input type='checkbox' name='unknown' checked={legend.unknown} onChange={legendChange} className='widget__filterpluslabel__input' />
            <span className='widget__filterpluslabel__text--unknown'>
              <FormattedMessage id='microplanning.display.unknown' defaultMessage='Unknown villages' />
            </span>
          </label>
        </form>

        <div className='legend'>
          <div className='points'>
            <ul>
              <li key='highlight'>
                <i className='fa fa-circle highlight' />
                <FormattedMessage id='microplanning.legend.highlight' defaultMessage='Villages with confirmed cases in the indicated period' />
              </li>
              <li key='selected'>
                <i className='fa fa-circle selected' />
                <FormattedMessage id='microplanning.legend.selected' defaultMessage='Selected villages' />
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

Map.MapLegend = {
  legend: PropTypes.object,
  legendChange: PropTypes.func
}

export default injectIntl(MapLegend)
