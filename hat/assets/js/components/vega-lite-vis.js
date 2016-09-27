import React, {Component, PropTypes} from 'react'
import {injectIntl, intlShape, defineMessages} from 'react-intl'
import Vega from 'vega'
import VegaLite from 'vega-lite'

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

function substituteValues (obj, subs, transform = null) {
  // Replace every occurence of a placeholder in a value of every property of the object.
  // The syntax for the placeholder is `${<varname>}`
  // An optional transform function can pretransform the substitute
  // e.g. `{foo: "${bar}"} => {foo: "baz"}` if `subs = {bar: "baz"}`
  // We use json.stringify -> json.parse to clone the object and replace values.
  transform = transform || ((x) => x)
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'string') {
      const match = value.match(/\$\{([a-zA-Z0-9_-]+)\}/)
      if (match) {
        const k = match[1]
        if (!subs.hasOwnProperty(k)) {
          console.warn('Cannot find match in substitudes for value:', value)
        } else {
          return transform(subs[k])
        }
      }
    }
    return value
  }))
}

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
    const vlSpec = substituteValues(vlSpecTemplate, MESSAGES, formatMessage)

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
