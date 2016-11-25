import React, {Component, PropTypes} from 'react'
import {injectIntl, intlShape} from 'react-intl'

//
// given a list of objects transforms it in a csv blob
// and creates the link to download
//
class ExportCSVButton extends Component {
  render () {
    const {formatMessage, formatDate} = this.props.intl
    const {data, columns, messages} = this.props
    const DELIMITER = this.props.delimiter || ';'
    const WRAP_STR = '"'
    const filename = this.props.filename || 'data.csv'

    const toCsv = (list) => {
      const headers = columns.map((col) => {
        return WRAP_STR + formatMessage(messages[col.message]) + WRAP_STR
      }).join(DELIMITER)

      const rows = list.map((row) => (
        columns.map((col) => {
          const val = row[col.key] || ''
          switch (col.type) {
            case 'number':
              return val
            case 'date':
              return (val !== '' ? WRAP_STR + formatDate(val) + WRAP_STR : val)
            default:
              return WRAP_STR + val + WRAP_STR
          }
        }).join(DELIMITER)
      ))

      return [headers].concat(rows).join('\n')
    }

    if (data && data.length) {
      const blob = new window.Blob([toCsv(data)], { type: 'text/csv' })
      const blobUrl = window.URL.createObjectURL(blob)

      return (
        <div ref={(node) => (this.container = node)}>
          <a href={blobUrl} download={filename} className='button--success button'>
            <i className='fa fa-download' />
            {this.props.children}
          </a>
        </div>
      )
    } else {
      return <div ref={(node) => (this.container = node)} />
    }
  }
}

ExportCSVButton.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.arrayOf(PropTypes.object),
  messages: PropTypes.object,
  delimiter: PropTypes.string,
  filename: PropTypes.string,
  intl: intlShape.isRequired
}

export default injectIntl(ExportCSVButton)
