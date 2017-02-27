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
import VegaLiteVis from '../../components/vega-lite-vis'
import VISUALIZATIONS from '../../../json/visualizations.json'
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

const Row = ({ className, label, value, definition, download }) => {
  return (
    <li className={className}>
      <span>
        {label}
        {definition && <em className='list__item__definition'>* {definition}</em>}
      </span>
      <span>
        <span className='list__item__number'>{value}</span>
        {download}
      </span>
    </li>
  )
}

export const DataTable = ({
  data: {
    total,
    screening,
    confirmation,
    meta,
    location,
    testedPerDay
  }
}) => {
  // Minimum one day out, otherwise we'll get more participants screened per day than we actually screened
  var daysOut = Math.max((new Date(meta.enddate) - new Date(meta.startdate)) / (1000 * 3600 * 24), 1)
  let dataCollectionPeriod = (meta.enddate && meta.startdate)
    ? (
      <span>
        <FormattedDate value={new Date(meta.startdate)} />
        &nbsp;&mdash;&nbsp;
        <FormattedDate value={new Date(meta.enddate)} />
      </span>
    )
    : (
      <span>
        <FormattedMessage id='monthlyreport.label.unknown.date' defaultMessage='Unknown date' />
        &nbsp;&mdash;&nbsp;
        <FormattedMessage id='monthlyreport.label.unknown.date' defaultMessage='Unknown date' />
      </span>
    )

  return (
    <div className='widget__container' data-qa='monthly-report-data-loaded'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='monthlyreport.header.results' defaultMessage='Monthly statistics from active screening using the HAT mobile application' />
        </h2>
      </div>
      <section>
        <h3 className='list__header block--margin-top--small'>
          <FormattedMessage id='monthlyreport.header.campaign_activity' defaultMessage='Campaign activity' />
        </h3>
        <ul className='list--stats'>
          <Row className='list__item--stats--important list__item--stats--blue'
            label={<FormattedMessage id='monthlyreport.items.villages_visited' defaultMessage='Villages visited' />}
            value={meta.villages_visited} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.as_visited' defaultMessage='Aires de Santé visited' />}
            value={meta.as_visited} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.tested' defaultMessage='Participants tested' />}
            value={total.tested} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.daily_screened' defaultMessage='Average number of participants screened per day' />}
            definition={<FormattedMessage id='monthlyreport.items.daily_screened.definition' defaultMessage='Participants with a screening test' />}
            value={Math.round(screening.total / daysOut)} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.date_range' defaultMessage='Data collection period' />}
            definition={<FormattedMessage id='monthlyreport.items.date_range.definition' defaultMessage='Taken from date of first entry and date of last entry' />}
            value={dataCollectionPeriod}
            />

          <div className='widget__content list__item--graph' data-qa='monthly-report-data-loaded'>
            <p>
              <FormattedMessage id='monthlyreport.header.graphs' defaultMessage='Number of participants tested on each day' />
            </p>
            <VegaLiteVis data={testedPerDay} spec={VISUALIZATIONS.count_per_day.spec} />
          </div>

        </ul>
      </section>
      <section>
        <h3 className='list__header'>
          <FormattedMessage id='monthlyreport.header.cases' defaultMessage='Case information' />
        </h3>
        <ul className='list--stats'>
          <Row className='list__item--stats--important list__item--stats--yellow'
            label={<FormattedMessage id='monthlyreport.items.confirmedmissing' defaultMessage='Participants missing confirmation tests' />}
            definition={<FormattedMessage id='monthlyreport.items.confirmedmissing.definition' defaultMessage='Participants with a positive screening test, but without a confirmation test' />}
            value={screening.missing_confirmation} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.confirmedpositive' defaultMessage='Confirmed cases' />}
            definition={<FormattedMessage id='monthlyreport.items.confirmedpositive.definition' defaultMessage='Participants with a positive confirmation test' />}
            value={confirmation.positive} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.suspected' defaultMessage='Suspected cases' />}
            definition={<FormattedMessage id='monthlyreport.items.suspected.definition' defaultMessage='Participants with a positive screening test' />}
            value={screening.positive} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.confirmednegative' defaultMessage='Negative cases' />}
            definition={<FormattedMessage id='monthlyreport.items.confirmednegative.definition' defaultMessage='Participants with a negative confirmation test' />}
            value={confirmation.negative} />
        </ul>
      </section>

      <section>
        <h3 className='list__header'>
          <FormattedMessage id='monthlyreport.header.tests' defaultMessage='Missing tests' />
        </h3>
        <ul className='list--stats'>
          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.not_tested' defaultMessage='Participants missing test results' />}
            definition={<FormattedMessage id='montlyreport.items.not_tested.definition' defaultMessage='Participants’ details registered but no test result was added' />}
            value={total.registered - total.tested} />
        </ul>
      </section>
      <div className='widget__footer'>
        <span className='text--data'>
          <FormattedMessage id='monthlyreport.datasource.label' defaultMessage='Data source' />:&nbsp;
          <FormattedMessage id='monthlyreport.datasource.mobiledata' defaultMessage='HAT mobile application data' />
        </span>
      </div>
    </div>
  )
}

export class MonthlyReport extends Component {
  constructor () {
    super()
    this.dateHandler = this.dateHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
  }

  dateHandler (event) {
    let date = event.target.value
    let url = createUrl({...this.props.params, date})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    let location = event.target.value
    let url = createUrl({...this.props.params, location})
    this.props.dispatch(push(url))
  }

  render () {
    const {formatMessage} = this.props.intl
    // source, sources also available
    const { date, location } = this.props.params
    const { dates } = this.props.config
    const { loading, data, error } = this.props.report
    const locations = data && data.locations || []

    return (
      <div>
        <div className='filter__container'>
          <h2 className='filter__label'><FormattedMessage id='monthlyreport.label.select' defaultMessage='Select:' /></h2>
          <div className='filter__container__select'>
            <label htmlFor='date' className='filter__container__select__label'><i className='fa fa-calendar' /><FormattedMessage id='monthlyreport.label.month' defaultMessage='Month' /></label>
            <select disabled={loading} name='date' value={date} onChange={this.dateHandler} className='select--minimised'>
              {dates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
          <div className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'><i className='fa fa-globe' /><FormattedMessage id='monthlyreport.label.location' defaultMessage='Location' /></label>
            <select disabled={loading} name='location' value={location || ''} onChange={this.locationHandler} className='select--minimised'>
              <option key='all' value=''>
                {formatMessage(MESSAGES['location-all'])}
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
                <h2 className='widget__heading text--error'><FormattedMessage id='monthlyreport.header.error' defaultMessage='Error:' /></h2>
              </div>
              <div className='widget__content'>
                {error}
              </div>
            </div>
          }
          {loading && <LoadingSpinner message={formatMessage(MESSAGES['loading'])} />}
          {data && <DataTable data={data} />}
        </div>
      </div>
    )
  }
}

const MonthlyReportWithIntl = injectIntl(MonthlyReport)

export default connect((state, ownProps) => ({
  config: state.config,
  report: state.report
}))(MonthlyReportWithIntl)
