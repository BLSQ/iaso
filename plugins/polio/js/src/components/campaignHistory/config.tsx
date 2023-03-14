import React from 'react';
import moment from 'moment';
import MESSAGES from '../../constants/messages';
import { GeoJsonMap } from '../../../../../../hat/assets/js/apps/Iaso/components/maps/GeoJsonMapComponent';

export const config: Record<string, any> = [
    {
        key: 'id',
    },
    {
        key: 'obr_name',
    },
    {
        key: 'created_at',
        getLogValue: log => moment(log.created_at).format('LTS'),
    },
    {
        key: 'rounds',
        type: 'array',
        childrenLabel: MESSAGES.round,
        children: [
            {
                key: 'id',
            },
            {
                key: 'number',
            },
            {
                key: 'started_at',
                getLogValue: log => moment(log.created_at).format('LTS'),
            },
        ],
    },
    {
        key: 'scopes',
        type: 'array',
        childrenLabel: MESSAGES.scope,
        children: [
            {
                key: 'id',
            },
            {
                key: 'group',
                type: 'object',
                childrenLabel: MESSAGES.group,
                children: [
                    {
                        key: 'id',
                    },
                    {
                        key: 'org_units',
                        getLogValue: log => log.org_units.join(', '),
                    },
                ],
            },
        ],
    },
    {
        key: 'geojson',
        getLogValue: log => <GeoJsonMap geoJson={log.geojson} />,
    },
];
