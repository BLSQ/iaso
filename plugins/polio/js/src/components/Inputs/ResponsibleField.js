import React from 'react';
import { Select } from './Select';

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

export const ResponsibleField = props => (
    <Select label="Responsible" options={RESPONSIBLES} {...props} />
);
