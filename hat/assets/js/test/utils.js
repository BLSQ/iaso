import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

export function renderWithIntl(Component, props) {
    const temp = (
        <IntlProvider locale="en" messages={{}}>
            <Component {...props} />
        </IntlProvider>
    );
    return TestUtils.renderIntoDocument(temp);
}
// TODO delete dead code
// export function renderWithDOMNode(Component, props, node) {
//     return ReactDOM.render(
//         // eslint-disable-line
//         <IntlProvider locale="en" messages={{}}>
//             <Component {...props} />
//         </IntlProvider>,
//         node,
//     );
// }

export function renderWithStore(store, component, node = null) {
    const wrappedComp = (
        <Provider store={store}>
            <IntlProvider locale="en">{component}</IntlProvider>
        </Provider>
    );
    if (!node) {
        node = document.createElement('div'); // eslint-disable-line
    }
    return ReactDOM.render(wrappedComp, node); // eslint-disable-line
}
