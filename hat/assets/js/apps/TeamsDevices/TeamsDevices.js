import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  FormattedMessage,
  FormattedDate,
  injectIntl,
  defineMessages
} from 'react-intl'
import LoadingSpinner from '../../components/loading-spinner'

import { createUrl } from '../../utils/fetchData'

const MESSAGES = defineMessages({
  'location-all': {
    defaultMessage: 'All',
    id: 'monthlyreport.labels.all'
  },
  'loading': {
    defaultMessage: 'Loading',
    id: 'monthlyreport.labels.loading'
  }
})

export const DataTable = ({
  data: {
    device_status
  }
}) => {
  return (
    <div className='widget__container' data-qa='monthly-report-data-loaded'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='monthlyreport.header.results' defaultMessage='Synchronization of Devices' />
        </h2>
      </div>

      <div>
        <table>
          <thead>
            <tr>
              <th>
                <FormattedMessage id='teamsdevices.device_id' defaultMessage='Device id' />
              </th>
              <th>
                <FormattedMessage id='teamsdevices.last_sync' defaultMessage='Last Sync' />
              </th>
              <th>
                <FormattedMessage id='teamsdevices.days_ago' defaultMessage='Days Ago' />
              </th>
              <th>
                <FormattedMessage id='teamsdevices.sync_summary' defaultMessage='Total-Created-Updated-Deleted' />
              </th>
            </tr>
          </thead>
          <tbody>
            {device_status.map(function (status, i) {
              let daysClass = 'ok'
              if (status.days_since_sync > 20) {
                daysClass = 'warning'
              }
              if (status.days_since_sync > 40) {
                daysClass = 'error'
              }
              return <tr>
                <td>{status.device_id}</td>
                <td><FormattedDate value={new Date(status.last_synced_date)}/></td>
                <td className={daysClass}>{status.days_since_sync}</td>
                <td>{status.last_synced_log_message}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export class TeamsDevices extends Component {
  constructor () {
    super()
    this.dateHandler = this.dateHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
  }

  dateHandler (event) {
    const url = createUrl({...this.props.params, date_month: event.target.value})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    const url = createUrl({...this.props.params, location: event.target.value})
    this.props.dispatch(push(url))
  }

  render () {
    const {formatMessage} = this.props.intl
    const { location } = this.props.params
    const { dates } = this.props.config
    const { loading, data, error } = this.props.report
    const locations = (data && data.locations) || []
    const dateMonth = this.props.params.date_month || ''
    console.log("thatDATA", data);
    return (
      <div>
        <div className='filter__container'>
          <h2 className='filter__label'><FormattedMessage id='monthlyreport.label.select' defaultMessage='Select:' /></h2>
          <div className='filter__container__select'>
            <label htmlFor='dateMonth' className='filter__container__select__label'><i className='fa fa-calendar' /><FormattedMessage id='monthlyreport.label.month' defaultMessage='Month' /></label>
            <select disabled={loading} name='dateMonth' value={dateMonth} onChange={this.dateHandler} className='select--minimised'>
              {dates.map((date) => <option key={date} value={date}>{date}</option>)}
            </select>
          </div>
          {
            locations.length > 0 &&
            <div className='filter__container__select'>
              <label htmlFor='location' className='filter__container__select__label'><i className='fa fa-globe' /><FormattedMessage id='monthlyreport.label.location' defaultMessage='Location' /></label>
              <select disabled={loading} name='location' value={location || ''} onChange={this.locationHandler} className='select--minimised'>
                <option key='all' value=''>
                  {formatMessage(MESSAGES['location-all'])}
                </option>
                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          }
        </div>

        {
          error && <div className='widget__container'>
            <div className='widget__header'>
              <h2 className='widget__heading text--error'><FormattedMessage id='monthlyreport.header.error' defaultMessage='Error:' /></h2>
            </div>
            <div className='widget__content'>
              {error}
            </div>
          </div>
        }
        {
          loading && <LoadingSpinner message={formatMessage(MESSAGES['loading'])} />
        }
        {
          data && <DataTable data={data} />
        }
      </div>
    )
  }
}

const TeamsDevicesWithIntl = injectIntl(TeamsDevices)

export default connect((state, ownProps) => ({
  config: state.config,
  report: state.report
}))(TeamsDevicesWithIntl)
