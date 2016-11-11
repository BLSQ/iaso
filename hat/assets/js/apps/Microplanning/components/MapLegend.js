import React, {Component, PropTypes} from 'react'
import {injectIntl, intlShape} from 'react-intl'

class MapLegend extends Component {
  render () {
    const {scale, label, max} = this.props

    const squares = []
    for (let i = 0.1; i < 1.1; i += 0.1) {
      squares.push(<li key={i} style={{backgroundColor: scale(i).hex()}} />)
    }

    return (
      <div ref={(node) => (this.container = node)} className='legend'>
        <ul>
          {squares}
        </ul>
        <div className='labels'>
          <div className='min'>{label}</div>
          <div className='max'>&gt;{max}</div>
        </div>
      </div>
    )
  }
}

MapLegend.propTypes = {
  scale: PropTypes.func,
  label: PropTypes.string,
  max: PropTypes.number,
  intl: intlShape.isRequired
}

export default injectIntl(MapLegend)
