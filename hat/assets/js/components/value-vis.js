import React, {Component, PropTypes} from 'react'

class ValueVis extends Component {
  render () {
    return <p>Value: {this.props.data.value}</p>
  }
}

ValueVis.propTypes = {
  data: PropTypes.shape({
    value: PropTypes.number
  })
}

export default ValueVis
