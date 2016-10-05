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

const MESSAGES = defineMessages({
  // colum headers
  'column-date': {
    id: 'suspectcases.table.column.date',
    defaultMessage: 'Date'
  },
  'column-zs': {
    id: 'suspectcases.table.column.zs',
    defaultMessage: 'ZS'
  },
  'column-az': {
    id: 'suspectcases.table.column.az',
    defaultMessage: 'AZ'
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
  },
  onNextClick,
  onPrevClick
}) => {
  return (
    <div className='widget__container' data-qa='monthly-report-data-loaded'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          {cases && cases.count} <FormattedMessage id='suspectcases.header.results' defaultMessage='Results' />
        </h2>
      </div>
      <section>
        <h3 className='list__header block--margin-top--small'>
          <FormattedMessage id='suspectcases.header.campaign_activity' defaultMessage='Suspect cases' />
        </h3>
        <table>
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
    </div>
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

// const DATEPERIOD_MESSAGES = {
//   'current-month': {
//     defaultMessage: 'Current month',
//     id: 'suspectcases.dateperiod.current-month'
//   },
//   'current-trimester': {
//     defaultMessage: 'Current trimester',
//     id: 'suspectcases.dateperiod.{current-trimester'
//   },
//   'current-year': {
//     defaultMessage: 'Current year',
//     id: 'suspectcases.dateperiod.current-year'
//   },
//   'last-month': {
//     defaultMessage: 'Last month',
//     id: 'suspectcases.dateperiod.last-month'
//   },
//   'last-trimester': {
//     defaultMessage: 'Last trimester',
//     id: 'suspectcases.dateperiod.last-trimester'
//   },
//   'last-year': {
//     defaultMessage: 'Last year',
//     id: 'suspectcases.dateperiod.last-year'
//   },
//   'since-last-year': {
//     defaultMessage: 'Since last year',
//     id: 'suspectcases.dateperiod.since-last-year'
//   },
//   'since-two-years': {
//     defaultMessage: 'Since two years',
//     id: 'suspectcases.dateperiod.since-two-years'
//   },
//   'since-three-years': {
//     defaultMessage: 'Since three years',
//     id: 'suspectcases.dateperiod.since-three-years'
//   },
// }

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
    const url = createUrl({...this.props.params, dateperiod})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    const location = event.target.value
    const url = createUrl({...this.props.params, location})
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
    const { loading, data, error } = this.props.suspects
    const locations = data && data.locations || []

    return (
      <div>
        <div className='filter__container'>
          <h2 className='filter__label'>Select:</h2>
          <div className='filter__container__select'>
            <label htmlFor='date' className='filter__container__select__label'>Period</label>
            <select disabled={loading} name='date' value={dateperiod} onChange={this.dateHandler} className='select--minimised'>
              {DATEPERIODS.map((period) => (
                <option key={period} value={period}>
                  {formatMessage(MESSAGES[period])}
                </option>
              ))}
            </select>
          </div>
          <div className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'>Location</label>
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
            error &&
              <div className='widget__container'>
                <div className='widget__header'>
                  <h2 className='widget__heading text--error'>Error:</h2>
                </div>
                <div className='widget__content'>
                  {error}
                </div>
              </div>
          }
          {
            loading &&
              <div className='widget__container'>
                <div className='widget__header'>
                  <h2 className='widget__heading'>Loading...</h2>
                </div>
              </div>
          }
          {
            data &&
              <DataTable data={data} />
          }
          <div>
            {
              data && data.cases && data.cases.previous &&
                <button className='button' onClick={this.prevHandler}>Previous</button>
            }
            {
              data && data.cases && data.cases.next &&
                <button className='button' style={{marginLeft: '10px'}} onClick={this.nextHandler}>Next</button>
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
  suspects: state.suspects
}))(SuspectCasesWithIntl)
