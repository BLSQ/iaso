import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const RESPONSIBLES = [
    {
        value: 'WHO',
        label: 'WHO',
    },
    {
        value: 'UNICEF',
        label: 'UNICEF',
    },
    {
        value: 'NAT',
        label: 'National',
    },
    {
        value: 'MOH',
        label: 'MOH',
    },
    {
        value: 'PROV',
        label: 'PROVINCE',
    },
    {
        value: 'DIST',
        label: 'District',
    },
];

export const ResponsibleField = props => {
    const { formatMessage } = useSafeIntl();

    return (
        <Select
            label={formatMessage(MESSAGES.responsible)}
            options={RESPONSIBLES}
            {...props}
        />
    );
};
