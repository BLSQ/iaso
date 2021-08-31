import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils, { act } from 'react-dom/test-utils';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import InputComponent from '../apps/Iaso/components/forms/InputComponent';
import { QueryClient, QueryClientProvider } from 'react-query';
const queryClient = new QueryClient();

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

export function withQueryClientProvider(component) {
    return (
        <QueryClientProvider client={queryClient}>
            {component}
        </QueryClientProvider>
    );
}

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

export const awaitUseEffect = async wrapper => {
    await act(async () => {
        await Promise.resolve(wrapper);
        await new Promise(resolve => setImmediate(resolve));
        wrapper.update();
    });
    return Promise.resolve();
};

// Fill several text fields
export const fillFields = async (component, fieldKeys) => {
    for (let i = 0; i < fieldKeys.length; i += 1) {
        const keyValue = fieldKeys[i];
        const element = component
            .find(InputComponent)
            .filter(`[keyValue="${keyValue}"]`);
        expect(element.exists()).to.equal(true);
        element.props().onChange(keyValue, 'LINK');
        // eslint-disable-next-line no-await-in-loop
        await awaitUseEffect(component);
    }
};
