import React, {Component, PropTypes} from 'react'
import {
  FormattedMessage,
  injectIntl,
  intlShape
} from 'react-intl'

class MapLegend extends Component {
  render () {
    const {scale, min, max} = this.props

    const squares = []
    for (let i = 0.1; i < 1.1; i += 0.1) {
      squares.push(
        <li key={i} style={{backgroundColor: scale(i).hex()}} />
      )
    }

    return (
      <div ref={(node) => (this.container = node)} className='legend'>
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

        <div className='scale'>
          <ul>
            {squares}
          </ul>
          <div className='labels'>
            <div className='min'>{min}</div>
            <div className='max'>&gt;{max}</div>
          </div>
        </div>
      </div>
    )
  }
}

MapLegend.propTypes = {
  scale: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
  intl: intlShape.isRequired
}

export default injectIntl(MapLegend)
