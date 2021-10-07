import React from 'react';
import { useSafeIntl, useTranslatedOptions } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const responsibles = [
    {
        value: 'WHO',
        label: MESSAGES.who,
        // label: formatMessage(MESSAGES.who),
    },
    {
        value: 'UNICEF',
        label: MESSAGES.unicef,
        // label: formatMessage(MESSAGES.unicef),
    },
    {
        value: 'NAT',
        label: MESSAGES.national,
        // label: formatMessage(MESSAGES.national),
    },
    {
        value: 'MOH',
        label: MESSAGES.moh,
        // label: formatMessage(MESSAGES.moh),
    },
    {
        value: 'PROV',
        label: MESSAGES.provinceOption,
        // label: formatMessage(MESSAGES.provinceOption),
    },
    {
        value: 'DIST',
        label: MESSAGES.district,
        // label: formatMessage(MESSAGES.district),
    },
];

export const ResponsibleField = props => {
    const { formatMessage } = useSafeIntl();
    const options = useTranslatedOptions(responsibles);

    return (
        <Select
            label={formatMessage(MESSAGES.responsible)}
            options={options}
            // options={responsibles(formatMessage)}
            {...props}
        />
    );
};
