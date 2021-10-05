import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const responsibles = formatMessage => [
    {
        value: 'WHO',
        label: formatMessage(MESSAGES.who),
    },
    {
        value: 'UNICEF',
        label: formatMessage(MESSAGES.unicef),
    },
    {
        value: 'NAT',
        label: formatMessage(MESSAGES.national),
    },
    {
        value: 'MOH',
        label: formatMessage(MESSAGES.moh),
    },
    {
        value: 'PROV',
        label: formatMessage(MESSAGES.provinceOption),
    },
    {
        value: 'DIST',
        label: formatMessage(MESSAGES.district),
    },
];

export const ResponsibleField = props => {
    const { formatMessage } = useSafeIntl();

    return (
        <Select
            label={formatMessage(MESSAGES.responsible)}
            options={responsibles(formatMessage)}
            {...props}
        />
    );
};
