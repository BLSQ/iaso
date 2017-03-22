import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  FormattedMessage,
  injectIntl,
  defineMessages
} from 'react-intl'
import LoadingSpinner from '../../components/loading-spinner'
import { createUrl } from '../../utils/fetchData'
import moment from 'moment'
import * as d3 from 'd3'

import DatePicker from 'react-datepicker'
import DatePickerStyles from 'react-datepicker/dist/react-datepicker.css' // eslint-disable-line no-unused-vars

import MG from 'metrics-graphics'
import MGStyles from 'metrics-graphics/dist/metricsgraphics.css' // eslint-disable-line no-unused-vars

const MESSAGES = defineMessages({
  'location-all': {
    defaultMessage: 'All',
    id: 'stats.labels.all'
  },
  'loading': {
    defaultMessage: 'Loading',
    id: 'stats.labels.loading'
  }
})

class Visualization extends Component {
  componentDidMount () {
    this.updateChart()
  }
  componentDidUpdate () {
    this.updateChart()
  }
  updateChart () {
    const data = this.props.data || []
    const spec = this.props.spec || {}
    const chartData = MG.convert.date(JSON.parse(JSON.stringify(data)), 'date')
    MG.data_graphic({
      area: false,
      data: chartData,
      full_width: true,
      height: 200,
      target: this.container,
      // Transitions can easily kill the browser with lots of data points. So we disable them
      transition_on_update: false,
      ...spec
    })
  }
  render () {
    return <div ref={(node) => (this.container = node)} />
  }
}

const noneMessage = <FormattedMessage id='statspage.none' defaultMessage='none' />

class Donut extends Component {
  componentDidMount () {
    this.updateDonut()
  }
  componentDidUpdate () {
    this.updateDonut()
  }

  render () {
    const v = this.props.value || 0
    const p = Math.round(v * 10000) / 100
    return <div className='donut'>
      <span className='donut--number'>{p}%</span>
      <div ref={(node) => (this.container = node)} />
    </div>
  }

  updateDonut () {
    // remove the old old donut and then add a new one
    if (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.childNodes[0])
    }
    const value = this.props.value || 0
    const width = 600
    const height = 300
    const halfWidth = width / 2
    const halfHeight = height / 2
    const radius = Math.min(width, height) / 2

    const arc = d3.arc()
        .outerRadius(radius - 20)
        .innerRadius(radius - 60)

    const svg = d3.select(this.container)
          .append('svg')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('viewBox', `0 0 ${width} ${height}`)
          .attr('preserveAspectRatio', 'xMinYMin')
          .append('g')
          .attr('transform', `translate(${halfWidth},${halfHeight})`)

    const pie = d3.pie()
          .sort(null)

    const g = svg.selectAll('.arc')
          .data(pie([1 - value, value]))
          .enter()
          .append('g')
          .attr('class', 'arc')

    const colors = ['rgb(216, 216, 216)', 'rgb(242, 208, 51)']

    g.append('path')
      .attr('d', arc)
      .style('fill', (d) => colors[d.index])
  }
}

class ParticipationWidget extends Component {
  render () {
    const {coverage} = this.props
    const totalVillages = coverage.total_visited || '0'
    const villagesWithEstimate = coverage.visited_with_population || '0'
    const population = coverage.population || 0
    const registered = coverage.registered_with_population || 0
    const percentageScreened = registered
          ? Math.round(registered / population * 10000) / 100 + '%'
          : noneMessage
    const donutValue = registered ? registered / population : 0

    return <div className='widget__container'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='statspage.participation.header' defaultMessage='Proportion of population screened' />
        </h2>
      </div>
      <div className='widget__content'>
        <section className='wrapper__column'>
          <div className='column--4'>
            <h2 className='block--margin-bottom--xs'>
              <FormattedMessage id='statspage.participation.subheader' defaultMessage='Participation rate' />
              :&nbsp;{percentageScreened}
            </h2>
            <p>
              <FormattedMessage id='statspage.participation.description' defaultMessage='The percentage of the target population of the screened areas for this time period' />
            </p>
            <ul className='list--stats--reduced'>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.participation.registered' defaultMessage='Number of participants registered' />
                </span>
                <span className='list__item__number--prominent'>{registered}</span>
              </li>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.participation.totalpop' defaultMessage='Total population of screened areas (estimate)' />
                </span>
                <span className='list__item__number--prominent'>
                  {population}
                </span>
              </li>
            </ul>
            <span className='text--explanation'>
              <FormattedMessage id='statspage.participation.explanation'
                defaultMessage='There are {totalVillages} villages in this selection, but only {villagesWithEstimate} have population data. The participation rate is calculated using only these {villagesWithEstimate} villages.'
                values={{totalVillages, villagesWithEstimate}}
              />
            </span>
          </div>

          <div className='column--6 container__graph--6'>
            <Donut value={donutValue} />
          </div>
        </section>
      </div>
    </div>
  }
}

class RegisteredWidget extends Component {
  render () {
    const {timeseries, total} = this.props
    const percentageMissing = total.tested
          ? Math.round((total.registered - total.tested) / total.registered * 10000) / 100 + '%'
          : noneMessage
    const spec = {
      x_accessor: 'date',
      y_accessor: 'registered_total',
      right: 40,
      top: 20
    }
    return <div className='widget__container'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='statspage.registered.header.results' defaultMessage='Amount of people missing tests' />
        </h2>
      </div>
      <div className='widget__content'>
        <section className='wrapper__column'>
          <div className='column--4'>
            <h2 className='block--margin-bottom--xs'>
              {percentageMissing}
              &nbsp;
              <FormattedMessage id='statspage.registered.subheader' defaultMessage='missing tests' />
            </h2>
            <p>
              <FormattedMessage id='statspage.registered.description' defaultMessage='The percentage of participants registered in the app who are missing test results' />
            </p>
            <ul className='list--stats--reduced'>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.registered.count.tested' defaultMessage='Number of participants with a test result' />
                </span>
                <span className='list__item__number--prominent'>
                  {total.tested}
                </span>
              </li>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.registered.count.registered' defaultMessage='Number of participants registered' />
                </span>
                <span className='list__item__number--prominent'>
                  {total.registered}
                </span>
              </li>
            </ul>
          </div>
          <div className='column--6 container__graph--6'>
            <Visualization data={timeseries} spec={spec} />
          </div>
        </section>
      </div>
    </div>
  }
}

class ScreeningWidget extends Component {
  render () {
    const {timeseries, total} = this.props
    const percentagePositiveScreening = total.positive
          ? Math.round(total.positive / total.total * 10000) / 100 + '%'
          : noneMessage
    const spec = {
      x_accessor: 'date',
      y_accessor: ['screening_pos', 'screening_neg', 'screening_total'],
      // legend: ['positive', 'negative', 'total'],
      right: 40,
      top: 20
    }
    return <div className='widget__container'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='statspage.screening.header.results' defaultMessage='Screening tests' />
        </h2>
      </div>
      <div className='widget__content'>
        <section className='wrapper__column'>
          <div className='column--4'>
            <h2 className='block--margin-bottom--xs'>
              {percentagePositiveScreening}
              &nbsp;
              <FormattedMessage id='statspage.screening.subheader' defaultMessage='HAT probable' />
            </h2>
            <p>
              <FormattedMessage id='statspage.screening.description' defaultMessage='The percentage of participants tested who had a positive screening test (CATT or RDT)' />
            </p>
            <ul className='list--stats--reduced'>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.screening.count.pos' defaultMessage='Number of participants with a positive screening result' />
                </span>
                <span className='list__item__number--prominent'>
                  {total.positive}
                </span>
              </li>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.screening.count.neg' defaultMessage='Number of participants with a negative screening result' />
                </span>
                <span className='list__item__number--prominent'>
                  {total.negative}
                </span>
              </li>
            </ul>
            <span className='text--explanation'>
              <FormattedMessage id='statspage.screening.count.total'
                defaultMessage='Out of an overall total of {totalParticipants} participants registered.'
                values={{totalParticipants: total.total}}
              />
            </span>
          </div>
          <div className='column--6 container__graph--6'>
            <Visualization data={timeseries} spec={spec} />
          </div>
        </section>
      </div>
    </div>
  }
}

class ConfirmationWidget extends Component {
  render () {
    const {timeseries, total} = this.props
    const percentagePositiveConfirmation = total.positive
          ? Math.round(total.positive / total.total * 10000) / 100 + '%'
          : noneMessage
    const spec = {
      x_accessor: 'date',
      y_accessor: ['confirmation_pos', 'confirmation_neg', 'confirmation_total'],
      // legend: ['positive', 'negative', 'total'],
      right: 40,
      top: 20
    }
    return <div className='widget__container'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='statspage.confirmation.header.results' defaultMessage='Confirmation tests' />
        </h2>
      </div>
      <div className='widget__content'>
        <section className='wrapper__column'>
          <div className='column--4'>
            <h2 className='block--margin-bottom--xs'>
              {percentagePositiveConfirmation}
              &nbsp;
              <FormattedMessage id='statspage.confirmation.subheader' defaultMessage='HAT confirmed' />
            </h2>
            <p>
              <FormattedMessage id='statspage.confirmation.description' defaultMessage='The percentage of participants tested who had a positive confirmation test (PG, mAECT, CTC/WOO, or GE)' />
            </p>
            <ul className='list--stats--reduced'>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.confirmation.count.pos' defaultMessage='Number of participants confirmed positive for HAT' />
                </span>
                <span className='list__item__number--prominent'>
                  {total.positive}
                </span>
              </li>
              <li className='list__item--stats--reduced'>
                <span className='text--label'>
                  <FormattedMessage id='statspage.confirmation.count.neg' defaultMessage='Number of participants confirmed negative for HAT' />
                </span>
                <span className='list__item__number--prominent'>
                  {total.negative}
                </span>
              </li>
            </ul>
            <span className='text--explanation'>
              <FormattedMessage id='statspage.confirmation.count.total'
                defaultMessage='Out of an overall total of {totalParticipants} participants registered.'
                values={{totalParticipants: total.total}}
              />
            </span>
          </div>
          <div className='column--6 container__graph--6'>
            <Visualization data={timeseries} spec={spec} />
          </div>
        </section>
      </div>
    </div>
  }
}

class StageWidget extends Component {
  render () {
    const {timeseries, total} = this.props
    const spec = {
      x_accessor: 'date',
      y_accessor: ['stage2', 'stage1', 'staging'],
      // legend: ['stage2', 'stage1', 'total'],
      right: 40,
      top: 20
    }
    return <div>
      <div className='widget__container'>
        <div className='widget__header'>
          <h2 className='widget__heading'>
            <FormattedMessage id='statspage.stage.header.results' defaultMessage='Stage tests' />
          </h2>
        </div>
        <div className='widget__content'>
          <section className='wrapper__column'>
            <div className='column--4'>
              <ul className='list--stats--reduced'>
                <li className='list__item--stats--reduced'>
                  <span className='text--label'>
                    <FormattedMessage id='statspage.stage.count.pos' defaultMessage='Number of participants HAT Stage Two' />
                  </span>
                  <span className='list__item__number--prominent'>
                    {total.stage2}
                  </span>
                </li>
                <li className='list__item--stats--reduced'>
                  <span className='text--label'>
                    <FormattedMessage id='statspage.stage.count.neg' defaultMessage='Number of participants HAT Stage One' />
                  </span>
                  <span className='list__item__number--prominent'>
                    {total.stage1}
                  </span>
                </li>
              </ul>
              <span className='text--explanation'>
                <FormattedMessage id='statspage.stage.count.total'
                  defaultMessage='Out of an overall total of {totalParticipants} participants registered.'
                  values={{totalParticipants: total.total}}
                />
              </span>
            </div>
            <div className='column--6 container__graph--6'>
              <Visualization data={timeseries} spec={spec} />
            </div>
          </section>
        </div>
      </div>
      <div>
        <span className='text--data'>
          <FormattedMessage id='statspage.datasource.label' defaultMessage='Data sources' />
          {':'}
          &nbsp;
          <FormattedMessage id='statspage.datasource.mobiledata' defaultMessage='HAT mobile application data' />
          {','}
          &nbsp;
          <FormattedMessage id='statspage.datasource.historical' defaultMessage='HAT historical forms' />
          {','}
          &nbsp;
          <FormattedMessage id='statspage.datasource.pharmacovigilance' defaultMessage='Pharmacovigilance' />
        </span>
      </div>
    </div>
  }
}

class Widgets extends Component {
  render () {
    const data = this.props.data || []
    return <div data-qa='stats-data-loaded'>
      <ParticipationWidget coverage={data.coverage} />
      <RegisteredWidget timeseries={data.timeseries} total={data.total} />
      <ScreeningWidget timeseries={data.timeseries} total={data.screening} />
      <ConfirmationWidget timeseries={data.timeseries} total={data.confirmation} />
      <StageWidget timeseries={data.timeseries} total={data.staging} />
    </div>
  }
}

export class Stats extends Component {
  constructor () {
    super()
    this.dateFormat = 'YYYY-MM-DD'
    this.datefromHandler = this.datefromHandler.bind(this)
    this.datetoHandler = this.datetoHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
  }

  datefromHandler (date) {
    let url = createUrl({
      ...this.props.params,
      date_from: moment(date).format(this.dateFormat)
    })
    this.props.dispatch(push(url))
  }

  datetoHandler (date) {
    let url = createUrl({
      ...this.props.params,
      date_to: moment(date).format(this.dateFormat)
    })
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    let location = event.target.value
    let url = createUrl({...this.props.params, location})
    this.props.dispatch(push(url))
  }

  render () {
    const {formatMessage} = this.props.intl
    const { date_from, date_to, location } = this.props.params
    const { loading, data, error } = this.props.report
    const locations = (data && data.locations) || []
    const pickerFrom = date_from ? moment(date_from) : moment() // eslint-disable-line
    const pickerTo = date_to ? moment(date_to) : moment() // eslint-disable-line

    return (
      <div>
        <div className='filter__container'>

          <h2 className='filter__label'><FormattedMessage id='statspage.label.select' defaultMessage='Select:' /></h2>
          <div className='filter__container__select'>
            <label htmlFor='date-from' className='filter__container__select__label'><i className='fa fa-calendar' /><FormattedMessage id='statspage.label.datefrom' defaultMessage='From' /></label>
            <DatePicker
              dateFormat={this.dateFormat}
              dateFormatCalendar={this.dateFormat}
              selected={pickerFrom}
              onChange={this.datefromHandler} />
          </div>

          <div className='filter__container__select'>
            <label htmlFor='date-to' className='filter__container__select__label'><i className='fa fa-calendar' /><FormattedMessage id='statspage.label.dateto' defaultMessage='To' /></label>
            <DatePicker
              dateFormat={this.dateFormat}
              dateFormatCalendar={this.dateFormat}
              selected={pickerTo}
              onChange={this.datetoHandler} />
          </div>

          {locations.length > 0 && (
            <div className='filter__container__select'>
              <label htmlFor='location' className='filter__container__select__label'><i className='fa fa-globe' /><FormattedMessage id='statspage.label.location' defaultMessage='Location' /></label>
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
          )}
        </div>
        <div>
          {
            error && <div className='widget__container'>
              <div className='widget__header'>
                <h2 className='widget__heading text--error'><FormattedMessage id='statspage.header.error' defaultMessage='Error:' /></h2>
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
            data && <Widgets data={data} />
          }
        </div>
      </div>
    )
  }
}

const StatsWithIntl = injectIntl(Stats)

export default connect((state, ownProps) => ({
  config: state.config,
  report: state.report
}))(StatsWithIntl)
