import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {injectIntl, intlShape, defineMessages} from 'react-intl'
import Vega from 'vega'
import VegaLite from 'vega-lite'
import {substituteVars} from '../utils'

const MESSAGES = defineMessages({
  numParticipants: {
    id: 'vegavis.numparticipants',
    defaultMessage: 'Number of participants'
  },
  dayOfMonth: {
    id: 'vegavis.dayofmonth',
    defaultMessage: 'Day of the month'
  }
})

class VegaLiteVis extends Component {
  componentDidMount () {
    this.updateChart()
  }
  componentDidUpdate () {
    this.updateChart()
  }
  updateChart () {
    const {data, spec} = this.props
    if (!data || !spec) {
      return
    }
    const vlConfig = {config: {}}
    const vlData = {data: {values: data}}

    // combine data and visualization config into a VegaLite spec
    const vlSpecTemplate = Object.assign(vlData, vlConfig, spec)

    // replace the string placeholders in the spec with formatted messages
    const {formatMessage} = this.props.intl
    const vlSpec = substituteVars(vlSpecTemplate, MESSAGES, formatMessage)

    // compile the VegaLite spec to a Vega spec
    const vSpec = VegaLite.compile(vlSpec).spec
    // render the Vega graph from the spec
    Vega.parse.spec(vSpec, (err, chart) => {
      if (err) {
        console.log(err)
        return
      }
      chart({el: this.container, renderer: 'svg'}).update()
    })
  }
  render () {
    return <div ref={(node) => (this.container = node)} />
  }
}

VegaLiteVis.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  spec: PropTypes.object,
  intl: intlShape.isRequired
}

export default injectIntl(VegaLiteVis)
