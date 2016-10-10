import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  FormattedMessage,
  FormattedDate,
  injectIntl,
  defineMessages
} from 'react-intl'
import { createUrl } from '../../utils/fetchData'
import DownloadControls from './DownloadControls'
import { DOWNLOAD_RESET } from '../../redux/download'

const MESSAGES = defineMessages({
  // colum headers
  'column-date': {
    id: 'suspectcases.table.column.date',
    defaultMessage: 'Date'
  },
  'column-zs': {
    id: 'suspectcases.table.column.zs',
    defaultMessage: 'Zone de Sante'
  },
  'column-az': {
    id: 'suspectcases.table.column.az',
    defaultMessage: 'Aire de Sante'
  },
  'column-village': {
    id: 'suspectcases.table.column.village',
    defaultMessage: 'Village'
  },

  // dateperiod messages
  'current-month': {
    defaultMessage: 'Current month',
    id: 'suspectcases.dateperiod.current-month'
  },
  'current-trimester': {
    defaultMessage: 'Current trimester',
    id: 'suspectcases.dateperiod.{current-trimester'
  },
  'current-year': {
    defaultMessage: 'Current year',
    id: 'suspectcases.dateperiod.current-year'
  },
  'last-month': {
    defaultMessage: 'Last month',
    id: 'suspectcases.dateperiod.last-month'
  },
  'last-trimester': {
    defaultMessage: 'Last trimester',
    id: 'suspectcases.dateperiod.last-trimester'
  },
  'last-year': {
    defaultMessage: 'Last year',
    id: 'suspectcases.dateperiod.last-year'
  },
  'since-last-year': {
    defaultMessage: 'Since last year',
    id: 'suspectcases.dateperiod.since-last-year'
  },
  'since-two-years': {
    defaultMessage: 'Since two years',
    id: 'suspectcases.dateperiod.since-two-years'
  },
  'since-three-years': {
    defaultMessage: 'Since three years',
    id: 'suspectcases.dateperiod.since-three-years'
  },

  // misc
  'location-national': {
    defaultMessage: 'National',
    id: 'suspectcases.labels.national'
  }
})

const TABLE_COLUMNS = [
  {message: 'column-date', key: 'document_date', type: 'date'},
  {message: 'column-zs', key: 'ZS'},
  {message: 'column-az', key: 'AZ'},
  {message: 'column-village', key: 'village'}
]

export const DataTable = ({
  data: {
    cases,
    location
  }
}) => {
  return (
    <section className='widget__content'>
      <h3 className='block--margin-bottom--xxs'>
        <FormattedMessage id='suspectcases.header.campaign_activity' defaultMessage='Anonymised list of suspect cases' />
      </h3>
      <table className='table--minimised'>
        <thead>
          <tr>
            {
              TABLE_COLUMNS.map((col) => {
                return <th key={col.message}><FormattedMessage {...MESSAGES[col.message]} /></th>
              })
            }
          </tr>
        </thead>
        <tbody>
          {
            cases.results.map((row) => {
              return <tr key={row.document_id}>
                {
                  TABLE_COLUMNS.map((col) => {
                    const val = row[col.key]
                    switch (col.type) {
                      case 'date':
                        return <td key={col.message}><FormattedDate value={val} /></td>
                      default:
                        return <td key={col.message}>{val}</td>
                    }
                  })
                }
              </tr>
            })
          }
        </tbody>
      </table>
    </section>
  )
}

const DATEPERIODS = [
  'current-month',
  'current-trimester',
  'current-year',
  'last-month',
  'last-trimester',
  'last-year',
  'since-last-year',
  'since-two-years',
  'since-three-years'
]

export class SuspectCases extends Component {
  constructor () {
    super()
    this.dateHandler = this.dateHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
    this.nextHandler = this.nextHandler.bind(this)
    this.prevHandler = this.prevHandler.bind(this)
  }

  dateHandler (event) {
    const dateperiod = event.target.value
    // Reset offset when changing date/time
    const url = createUrl({...this.props.params, dateperiod, offset: null})
    this.props.dispatch({'type': DOWNLOAD_RESET})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    const location = event.target.value
    // Reset offset when changing date/time
    const url = createUrl({...this.props.params, location, offset: null})
    this.props.dispatch({'type': DOWNLOAD_RESET})
    this.props.dispatch(push(url))
  }

  nextHandler () {
    const cases = this.props.suspects.data.cases
    const offset = cases.offset + cases.limit
    const url = createUrl({...this.props.params, offset})
    this.props.dispatch(push(url))
  }

  prevHandler () {
    const cases = this.props.suspects.data.cases
    const offset = cases.offset - cases.limit
    const url = createUrl({...this.props.params, offset})
    this.props.dispatch(push(url))
  }

  render () {
    const {formatMessage} = this.props.intl
    // source, sources also available
    const { dateperiod, location } = this.props.params
    const { data, error } = this.props.suspects
    const locations = data && data.locations || []
    const loading = this.props.suspects.loading || this.props.download.loading
    const numResults = data && data.cases && data.cases.count || 0
    // Used in integration test to check loading + rendering
    const qaStatus = (data && !loading && !error) ? 'suspect-cases-data-loaded' : 'suspect-cases-loading'

    return (
      <div data-qa={qaStatus}>
        <div className='filter__container'>
          <h2 className='filter__label'>Select:</h2>
          <div className='filter__container__select'>
            <label htmlFor='date' className='filter__container__select__label'><i className='fa fa-calendar' /> Timeframe</label>
            <select disabled={loading} name='date' value={dateperiod} onChange={this.dateHandler} className='select--minimised'>
              {DATEPERIODS.map((period) => (
                <option key={period} value={period}>
                  {formatMessage(MESSAGES[period])}
                </option>
              ))}
            </select>
          </div>
          <div className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'><i className='fa fa-globe' /> Location</label>
            <select disabled={loading} name='location' value={location || ''} onChange={this.locationHandler} className='select--minimised'>
              <option key='all' value=''>
                {formatMessage(MESSAGES['location-national'])}
              </option>
              {locations.map((loc) => {
                var val = loc.ZS
                return <option key={val} value={val}>{val}</option>
              })}
            </select>
          </div>
        </div>
        <div>
          {
            error && <div className='widget__container'>
              <div className='widget__header'>
                <h2 className='widget__heading text--error'>Error:</h2>
              </div>
              <div className='widget__content'>
                {error}
              </div>
            </div>
          }
        </div>
        <div className='widget__container'>
          <div className='widget__header'>
            <h2 className='widget__heading'>
              {numResults} <FormattedMessage id='suspectcases.header.results' defaultMessage='suspect cases for this period' />
            </h2>
          </div>
          <span>
            {
              numResults
                ? data && <div className='widget__content'>
                  <p className='text--small block--margin-bottom--xs'>
                    <FormattedMessage
                      id='suspectcases.download.description'
                      defaultMessage='Results presented below as an anonymised list of suspect cases with date/location. You can download the full details of all suspected cases as a csv file.' />
                  </p>
                  <DownloadControls numResults={numResults} dateperiod={dateperiod} location={location} />
                </div>
              : null
            }
            {
              numResults
                ? data && <DataTable data={data} />
                : <div className='widget__content'><FormattedMessage id='suspectcases.data.noresults' defaultMessage='No results for this timeframe and location – use the controls above to select different parameters.' /></div>
            }
          </span>
          <div className='widget__pagination'>
            {
              data && data.cases && data.cases.previous && <button className='button--minimised block--margin-right--xxs' onClick={this.prevHandler}>
                <i className='fa fa-arrow-left' />
                Previous page
              </button>
            }
            {
              data && data.cases && data.cases.next && <button className='button--minimised' onClick={this.nextHandler}>
                Next page
                <i className='fa fa-arrow-right icon--right' />
              </button>
            }
          </div>
        </div>
      </div>
    )
  }
}

const SuspectCasesWithIntl = injectIntl(SuspectCases)

export default connect((state, ownProps) => ({
  config: state.config,
  suspects: state.suspects,
  download: state.download
}))(SuspectCasesWithIntl)
