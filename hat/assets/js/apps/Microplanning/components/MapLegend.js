import React, {Component} from 'react'
import {
  FormattedMessage,
  injectIntl,
  intlShape
} from 'react-intl'

class MapLegend extends Component {
  render () {
    return (
      <div className='legend'>
        <div className='points'>
          <ul>
            <li key='highlight'>
              <i className='fa fa-circle highlight' />
              <FormattedMessage id='microplanning.legend.highlight' defaultMessage='Villages with confirmed cases' />
            </li>
            <li key='selected'>
              <i className='fa fa-circle selected' />
              <FormattedMessage id='microplanning.legend.selected' defaultMessage='Selected villages' />
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

MapLegend.propTypes = {
  intl: intlShape.isRequired
}

export default injectIntl(MapLegend)
