/* global describe, it */
import assert from 'assert'
import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { IntlProvider } from 'react-intl'

import Comp1 from './comp1'

describe('Component1 unit test example', () => {
  it('renders', () => {
    const rendered = TestUtils.renderIntoDocument(
      <IntlProvider locale='en' messages={{}}>
        <Comp1 />
      </IntlProvider>
    )
    const node = ReactDOM.findDOMNode(rendered)
    assert(node.innerHTML.match(/component 1/i), 'renders component 1')
  })
})
