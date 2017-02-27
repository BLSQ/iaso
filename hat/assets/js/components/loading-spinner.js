import React, {Component, PropTypes} from 'react'

class LoadingSpinner extends Component {
  render () {
    const message = (this.props.message ? this.props.message + '…' : '')

    return (
      <div className='widget__spinner'>
        <div className='widget__spinner--text'>{message}</div>
        <div className='widget__spinner--icon'>
          <i className='fa fa-spinner fa-pulse fa-5x fa-fw' />
        </div>
      </div>
    )
  }
}

LoadingSpinner.propTypes = {
  message: PropTypes.string
}

export default LoadingSpinner
