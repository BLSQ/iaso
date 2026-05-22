import React from 'react';

import { IntlProvider } from 'react-intl';

const mock = require('mock-require');

export const mockMessages = () => {
    mock('__intl/messages/fr', []);
    mock('__intl/messages/en', []);
};

export const renderWithIntl = component => (
    <IntlProvider locale="en">{component}</IntlProvider>
);
