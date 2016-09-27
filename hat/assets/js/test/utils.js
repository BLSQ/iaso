import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { IntlProvider } from 'react-intl'

export function renderWithIntl (Component, props) {
  return TestUtils.renderIntoDocument(
    <IntlProvider locale='en' messages={{}}>
      <Component {...props} />
    </IntlProvider>
  )
}

export function renderWithDOMNode (Component, props, node) {
  return ReactDOM.render(
    <IntlProvider locale='en' messages={{}}>
      <Component {...props} />
    </IntlProvider>,
    node
  )
}
