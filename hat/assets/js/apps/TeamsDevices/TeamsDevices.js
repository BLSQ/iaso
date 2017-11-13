import React, { Component, fetch } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import superagent from 'superagent'

import {
  FormattedMessage,
  FormattedDate,
  injectIntl,
  defineMessages
} from 'react-intl'
import LoadingSpinner from '../../components/loading-spinner'
import Modal from '../../components/modal'

import { createUrl } from '../../utils/fetchData'

const MESSAGES = defineMessages({
  'location-all': {
    defaultMessage: 'All',
    id: 'teamsdevices.labels.all'
  },
  'loading': {
    defaultMessage: 'Loading',
    id: 'teamsdevices.labels.loading'
  }
})
export class DeviceEventsList extends Component {
  constructor () {
    super()
    this.state = {
      data: []
    }
  }

  render () {
    return <table>
      <thead>
      <tr>
        <th>Type</th>
        <th>Message</th>
        <th>Date</th>
        <th>User</th>
      </tr>
      </thead>
      <tbody>{
        this.state.data.map(function (event, i) {
          let eventType
          let eventLabel
          if (event.event_type == 0) {
            eventType = 'Status'
            eventLabel = event.status__label
          }

          if (event.event_type == 1) {
            eventType = 'Action'
            eventLabel = event.action__label
          }
          if (event.event_type == 2) {
            eventType = 'Comment'
            eventLabel = event.comment
          }
          return <tr>
            <td>{eventType}</td>
            <td>{eventLabel}</td>
            <td><FormattedDate value={new Date(event.date)}/></td>
            <td>{event.reporter__username}</td>
          </tr>
        })
      }
      </tbody>
    </table>
  }
  componentDidMount () {
    var that = this
    var url = '/api/datasets/device_events/?device_id=' + this.props.deviceId
    superagent.get(url).end((err, res) => {
      if (err) {
        console.log('error accessing url ', url, err)
        return
      }

      that.setState({
        'data': res.body
      })
    })
  }
}

export const DeviceEventForm = ({
  deviceId
}) => {
  return <form method='post' action={'/sync/device_event_form/' + deviceId + '/'}>

    <div className='teamsdevices__event__field__title'>Changer Statut</div>
    <select id='id_status' name='status'>
      <option value='' selected='selected'>---------</option>
      <option value='1'>Problèmes de connexion</option>
      <option value='2'>Problème résolu</option>
      <option value='3'>Problème technique</option>
    </select>
    <button name='event_type' value='0'>Envoyer</button>
    <div className='teamsdevices__event__field__title'>Action</div>
    <select id='id_action' name='action'>
      <option value='' selected='selected'>---------</option>
      <option value='1'>Utilisateur appelé</option>
      <option value='2'>Enquête de terrain</option>
    </select>
    <button name='event_type' value='1'>Envoyer</button>
    <div className='teamsdevices__event__field__title'>Ajouter commentaire</div>
    <textarea cols='40' id='id_comment' name='comment' rows='10'/>
    <button name='event_type' value='2'>Envoyer</button>
  </form>
}


export const DataTable = ({
  data: {
    device_status
  },
  auditClickHandler,
  moreClickHandler
}) => {
  return (
    <div className='widget__container' data-qa='monthly-report-data-loaded'>
      <div className='widget__header'>
        <h2 className='widget__heading'>
          <FormattedMessage id='teamsdevices.header.results' defaultMessage='Synchronisation des Appareils' />
        </h2>
      </div>

      <div>
        <table>
          <thead>
            <tr>
              <th>
                <FormattedMessage id='teamsdevices.device_id' defaultMessage='Identifiant' />
              </th>
              <th>
                <FormattedMessage id='teamsdevices.last_sync' defaultMessage='Dernière Sync' />
              </th>
              <th>
                <FormattedMessage id='teamsdevices.days_ago' defaultMessage='Jours passés' />
              </th>
              <th>
                <FormattedMessage id='teamsdevices.sync_summary' defaultMessage='Total-Créé-Màj-Effacé' />
              </th>
              <th>
                <FormattedMessage id='teamsdevices.status_audit' defaultMessage='Statut Audit' />
              </th>
              <th>
                <span></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {device_status.map(function (status, i) {
              let daysClass = 'ok'
              let daysString
              if (status.days_since_sync < 0 )
              {
                daysString = "Jamais Synchronisé"
              }
              else
              {
                daysString = status.days_since_sync
              }

              if (status.days_since_sync > 40 ) {
                daysClass = 'error'
              }
              if (status.days_since_sync > 20) {
                daysClass = 'warning'
              }

              return <tr>
                <td>{status.device_id}</td>
                <td><FormattedDate value={new Date(status.last_synced_date)}/></td>
                <td className={daysClass}>{daysString}</td>
                <td>{status.last_synced_log_message}</td>
                <td><a className='pointerClick' onClick={(e) => { auditClickHandler(e, status.id) }}>{status.last_status !='' ? status.last_status : 'Editer'}</a></td>
                <td><a className='pointerClick' onClick={(e) => { moreClickHandler(e, status.id) }}>Historique</a></td>
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
    this.state = {
      isOpen: false,
      currentDeviceId: false,
      edit: false
    }
  }

  dateHandler (event) {
    const url = createUrl({...this.props.params, date_month: event.target.value})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    const url = createUrl({...this.props.params, location: event.target.value})
    this.props.dispatch(push(url))
  }

  toggleModal (edit, event, deviceId) {
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
    this.setState({
      isOpen: !this.state.isOpen,
      currentDeviceId: deviceId,
      edit: edit
    })
  }
  render () {
    const {formatMessage} = this.props.intl
    const { location } = this.props.params
    const { dates } = this.props.config
    const { loading, data, error } = this.props.report
    const locations = (data && data.locations) || []
    const dateMonth = this.props.params.date_month || ''
    let modalContent;
    if (this.state.edit) {
      modalContent = <DeviceEventForm deviceId={this.state.currentDeviceId}/>
    } else {
      modalContent = <DeviceEventsList deviceId={this.state.currentDeviceId}/>
    }

    return (
      <div>
        <Modal show={this.state.isOpen} onClose={this.toggleModal.bind(this, false)}>
          {modalContent}
        </Modal>
        <div className='filter__container'>
          <h2 className='filter__label'><FormattedMessage id='teamsdevices.label.select' defaultMessage='Select:' /></h2>
          <div className='filter__container__select'>
            <label htmlFor='dateMonth' className='filter__container__select__label'><i className='fa fa-calendar' /><FormattedMessage id='teamsdevices.label.month' defaultMessage='Month' /></label>
            <select disabled={loading} name='dateMonth' value={dateMonth} onChange={this.dateHandler} className='select--minimised'>
              {dates.map((date) => <option key={date} value={date}>{date}</option>)}
            </select>
          </div>
          {
            locations.length > 0 &&
            <div className='filter__container__select'>
              <label htmlFor='location' className='filter__container__select__label'><i className='fa fa-globe' /><FormattedMessage id='teamsdevices.label.location' defaultMessage='Location' /></label>
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
              <h2 className='widget__heading text--error'><FormattedMessage id='teamsdevices.header.error' defaultMessage='Error:' /></h2>
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
          data && <DataTable data={data} auditClickHandler={this.toggleModal.bind(this, true)} moreClickHandler={this.toggleModal.bind(this, false)} />
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
