import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  FormattedMessage,
  injectIntl,
  defineMessages
} from 'react-intl'
import { createUrl } from '../../utils/fetchData'
import moment from 'moment'

import DatePicker from 'react-datepicker'
import DatePickerStyles from 'react-datepicker/dist/react-datepicker.css' // eslint-disable-line no-unused-vars

import MG from 'metrics-graphics'
import MGStyles from 'metrics-graphics/dist/metricsgraphics.css' // eslint-disable-line no-unused-vars

const MESSAGES = defineMessages({
  'location-national': {
    defaultMessage: 'National',
    id: 'stats.labels.national'
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

class ParticipationWidget extends Component {
  render () {
    const {coverage} = this.props
    const totalVillages = coverage.num_locations_visited
    const villagesWithEstimate = coverage.population_estimate.locations.length
    const population = coverage.population_estimate.population
    const registered = coverage.population_estimate.registered
    const percentage = Math.round(registered / population * 10000) / 100

    return <div className='widget__container'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='statspage.participation.header' defaultMessage='Coverage' />
        </h2>
      </div>
      <section className='widget__section--columnar'>
        <div className='widget__content--column2'>
          <ul>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.participation.totalpop' defaultMessage='Total estimated population in the villages' />
              </span>
              <span>
                <span className='list__item__number'>{population}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.participation.registered' defaultMessage='Total number of participants registered in the villages' />
              </span>
              <span>
                <span className='list__item__number'>{registered}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.participation.explanation'
                  defaultMessage='There are {totalVillages} villages in this selection, but only {villagesWithEstimate} have a population estimate. The participation rate is calculated from this reduced set.'
                  values={{totalVillages, villagesWithEstimate}}
                />
              </span>
            </li>
          </ul>
        </div>

        <div className='widget__content--column1'>
          <h1>{percentage}</h1>
          <div ref={(node) => (this.donutContainer = node)} />
        </div>
      </section>
    </div>
  }
}

class RegisteredWidget extends Component {
  render () {
    const {timeseries, total} = this.props
    const spec = {
      x_accessor: 'date',
      y_accessor: 'registered',
      right: 40,
      top: 20
    }
    return <div className='widget__container'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='statspage.registered.header.results' defaultMessage='Registered participants' />
        </h2>
      </div>
      <section className='widget__section--columnar'>
        <div className='widget__content--column1'>
          <ul className='list--stats'>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.registered.count.registered' defaultMessage='Registered' />
              </span>
              <span>
                <span className='list__item__number'>{total.registered}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.registered.count.tested' defaultMessage='Tested' />
              </span>
              <span>
                <span className='list__item__number'>{total.tested}</span>
              </span>
            </li>
          </ul>
        </div>
        <div className='widget__content--column2'>
          <Visualization data={timeseries} spec={spec} />
        </div>
      </section>
    </div>
  }
}

class ScreeningWidget extends Component {
  render () {
    const {timeseries, total} = this.props
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
      <section className='widget__section--columnar'>
        <div className='widget__content--column1'>
          <ul className='list--stats'>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.screening.count.pos' defaultMessage='Tested positive' />
              </span>
              <span>
                <span className='list__item__number'>{total.positive}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.screening.count.neg' defaultMessage='Tested negative' />
              </span>
              <span>
                <span className='list__item__number'>{total.negative}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.screening.count.total' defaultMessage='Total' />
              </span>
              <span>
                <span className='list__item__number'>{total.total}</span>
              </span>
            </li>
          </ul>
        </div>
        <div className='widget__content--column2'>
          <Visualization data={timeseries} spec={spec} />
        </div>
      </section>
    </div>
  }
}

class ConfirmationWidget extends Component {
  render () {
    const {timeseries, total} = this.props
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
      <section className='widget__section--columnar'>
        <div className='widget__content--column1'>
          <ul className='list--stats'>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.confirmation.count.pos' defaultMessage='Tested positive' />
              </span>
              <span>
                <span className='list__item__number'>{total.positive}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.confirmation.count.neg' defaultMessage='Tested negative' />
              </span>
              <span>
                <span className='list__item__number'>{total.negative}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.confirmation.count.total' defaultMessage='Total' />
              </span>
              <span>
                <span className='list__item__number'>{total.total}</span>
              </span>
            </li>
          </ul>
        </div>
        <div className='widget__content--column2'>
          <Visualization data={timeseries} spec={spec} />
        </div>
      </section>
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
    return <div className='widget__container'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='statspage.stage.header.results' defaultMessage='Stage tests' />
        </h2>
      </div>
      <section className='widget__section--columnar'>
        <div className='widget__content--column1'>
          <ul className='list--stats'>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.stage.count.pos' defaultMessage='Tested positive' />
              </span>
              <span>
                <span className='list__item__number'>{total.stage2}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.stage.count.neg' defaultMessage='Tested negative' />
              </span>
              <span>
                <span className='list__item__number'>{total.stage1}</span>
              </span>
            </li>
            <li className='list__item--stats'>
              <span>
                <FormattedMessage id='statspage.stage.count.total' defaultMessage='Total' />
              </span>
              <span>
                <span className='list__item__number'>{total.total}</span>
              </span>
            </li>
          </ul>
        </div>
        <div className='widget__content--column2'>
          <Visualization data={timeseries} spec={spec} />
        </div>
      </section>
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
    let url = createUrl({...this.props.params,
                         datefrom: moment(date).format(this.dateFormat)})
    this.props.dispatch(push(url))
  }

  datetoHandler (date) {
    let url = createUrl({...this.props.params,
                         dateto: moment(date).format(this.dateFormat)})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    let location = event.target.value
    let url = createUrl({...this.props.params, location})
    this.props.dispatch(push(url))
  }

  render () {
    const {formatMessage} = this.props.intl
    const { datefrom, dateto, location } = this.props.params
    const { loading, data, error } = this.props.report
    const locations = data && data.locations || []
    const pickerFrom = datefrom ? moment(datefrom) : moment()
    const pickerTo = dateto ? moment(dateto) : moment()

    return (
      <div>
        <div className='filter__container'>

          <h2 className='filter__label'><FormattedMessage id='statspage.label.select' defaultMessage='Select:' /></h2>
          <div className='filter__container__select'>
            <label htmlFor='date-from' className='filter__container__select__label'><i className='fa fa-calendar' /><FormattedMessage id='statspage.label.datefrom' defaultMessage='From' /></label>
            <DatePicker
              selected={pickerFrom}
              onChange={this.datefromHandler} />
          </div>

          <div className='filter__container__select'>
            <label htmlFor='date-to' className='filter__container__select__label'><i className='fa fa-calendar' /><FormattedMessage id='statspage.label.dateto' defaultMessage='To' /></label>
            <DatePicker
              selected={pickerTo}
              onChange={this.datetoHandler} />
          </div>

          <div className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'><i className='fa fa-globe' /><FormattedMessage id='statspage.label.location' defaultMessage='Location' /></label>
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
                <h2 className='widget__heading text--error'><FormattedMessage id='statspage.header.error' defaultMessage='Error:' /></h2>
              </div>
              <div className='widget__content'>
                {error}
              </div>
            </div>
          }
          {
            loading && <div className='widget__container'>
              <div className='widget__header'>
                <h2 className='widget__heading'><FormattedMessage id='statspage.header.loading' defaultMessage='Loading...' /></h2>
              </div>
            </div>
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
