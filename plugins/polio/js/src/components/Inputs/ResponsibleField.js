import React from 'react';
import { useSafeIntl, useTranslatedOptions } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const responsibles = [
    {
        value: 'WHO',
        label: MESSAGES.who,
    },
    {
        value: 'UNICEF',
        label: MESSAGES.unicef,
    },
    {
        value: 'NAT',
        label: MESSAGES.national,
    },
    {
        value: 'MOH',
        label: MESSAGES.moh,
    },
    {
        value: 'PROV',
        label: MESSAGES.provinceOption,
    },
    {
        value: 'DIST',
        label: MESSAGES.district,
    },
];

export const ResponsibleField = props => {
    const { formatMessage } = useSafeIntl();
    const options = useTranslatedOptions(responsibles);

    return (
        <Select
            label={formatMessage(MESSAGES.responsible)}
            options={options}
            {...props}
        />
    );
};
