import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

const MESSAGES = defineMessages({
    yes: {
        defaultMessage: 'Yes',
        id: 'iaso.label.yes',
    },
    no: {
        defaultMessage: 'No',
        id: 'iaso.label.no',
    },
});

export const YesNoCell = cellInfo => {
    return cellInfo.value === true ? (
        <FormattedMessage {...MESSAGES.yes} />
    ) : (
        <FormattedMessage {...MESSAGES.no} />
    );
};
