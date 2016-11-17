import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'

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

export function renderWithStore (store, component, node = null) {
  const wrappedComp = (
    <Provider store={store}>
      <IntlProvider locale='en'>{component}</IntlProvider>
    </Provider>
  )
  if (!node) {
    node = document.createElement('div')
  }
  return ReactDOM.render(wrappedComp, node)
}
