import React from 'react';
import moment from 'moment';
import Checkbox from '@material-ui/core/Checkbox';

import getDisplayName from '../utils/usersUtils';
import StarsComponent from '../components/stars/StarsComponent';

const linksTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Similarity score',
                id: 'iaso.label.similarity_score',
            }),
            width: 170,
            accessor: 'similarity_score',
            Cell: settings => (
                <div className="middle-align">
                    <StarsComponent
                        score={settings.original.similarity_score}
                        bgColor={settings.index % 2 ? 'white' : '#f7f7f7'}
                        displayCount
                    />
                </div>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.label.name',
            }),
            accessor: 'destination__name',
            Cell: settings => (
                <span>
                    {settings.original.destination.name}
                    {' '}
                    /
                    {' '}
                    {settings.original.source.name}
                </span>
            ),
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Source',
                id: 'iaso.label.source',
            })} 1`,
            accessor: 'destination__source',
            Cell: settings => (
                <span>
                    {settings.original.destination.source}
                </span>
            ),
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Source',
                id: 'iaso.label.source',
            })} 2`,
            accessor: 'source__source',
            Cell: settings => (
                <span>
                    {settings.original.source.source}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.label.updated_at',
            }),
            accessor: 'updated_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.updated_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Algorithm',
                id: 'iaso.label.algorithm',
            }),
            accessor: 'algorithm_run',
            Cell: settings => (
                settings.original.algorithm_run.algorithm.name
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Validated',
                id: 'iaso.forms.validated',
            }),
            accessor: 'validated',
            Cell: settings => (
                <Checkbox
                    color="primary"
                    checked={settings.original.validated}
                    onChange={() => component.validateLink(settings.original)}
                    value="checked"
                />
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Validator',
                id: 'iaso.label.validator',
            }),
            accessor: 'validator',
            Cell: settings => (
                settings.original.validator ? getDisplayName(settings.original.validator) : '/'
            ),
        },
    ]
);
export default linksTableColumns;
