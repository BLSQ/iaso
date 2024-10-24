import React from 'react';
import TestUtils, { act } from 'react-dom/test-utils';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Route } from 'react-router-dom';
import InputComponent from '../apps/Iaso/components/forms/InputComponent.tsx';

const queryClient = new QueryClient();

export function renderWithIntl(Component, props) {
    const temp = (
        <IntlProvider locale="en" messages={{}}>
            <Component {...props} />
        </IntlProvider>
    );
    return TestUtils.renderIntoDocument(temp);
}

export function withQueryClientProvider(component) {
    return (
        <QueryClientProvider client={queryClient}>
            {component}
        </QueryClientProvider>
    );
}

export function withRouter(component) {
    const route = <Route path="/*" element={component} key="key" />;
    return <BrowserRouter routes={[route]} />;
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

export const colOriginal = original => ({
    row: {
        original,
    },
});
