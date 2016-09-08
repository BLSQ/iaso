/* global __LOCALE */
import React, { Component } from 'react'
import { IntlProvider, addLocaleData } from 'react-intl'
import { Provider } from 'react-redux'
import { Router } from 'react-router'

// the intl paths get rewritten by webpack depending on the locale
import messages from '__intl/messages'
import localeData from '__intl/localeData'

addLocaleData(localeData)
const locale = __LOCALE

export default class App extends Component {
  render () {
    const { store, routes, history } = this.props
    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <Router
            routes={routes}
            history={history} />
        </Provider>
      </IntlProvider>
    )
  }
}
