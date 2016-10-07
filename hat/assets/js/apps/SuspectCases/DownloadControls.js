import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { fetchTaskResult } from '../../utils/fetchData'

class DownloadControls extends Component {
  constructor (props) {
    super(props)
    this.downloadHandler = this.downloadHandler.bind(this)
  }

  downloadHandler () {
    fetchTaskResult('/api/tasks/', {
      type: 'download',
      options: {
        dateperiod: this.props.dateperiod,
        location: this.props.location,
        only_suspects: true,
        sep: ';'
      }
    }, this.props.dispatch)
  }

  render () {
    const numResults = this.props.numResults
    const { loading, resultUrl } = this.props.download
    let state = 'none'
    if (resultUrl) {
      state = 'show-result-link'
    } else if (loading) {
      state = 'loading'
    } else if (numResults > 0) {
      state = 'show-prepare'
    }

    switch (state) {
      case 'show-prepare':
        return <button className='button' onClick={this.downloadHandler}>
          <FormattedMessage id='download.prepare' defaultMessage='Prepare download' />
        </button>
      case 'loading':
        return <button className='button' disabled='true'>
          <FormattedMessage id='download.prepare' defaultMessage='Preparing' />...
        </button>
      case 'show-result-link':
        return <a href={resultUrl} className='button'>
          <FormattedMessage id='download.prepare' defaultMessage='Download file' />
        </a>
      default:
        return <span />
    }
  }
}

export default connect((state, ownProps) => ({
  download: state.download
}))(DownloadControls)
