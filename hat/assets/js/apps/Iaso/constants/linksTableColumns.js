import React from 'react';
import moment from 'moment';
import Checkbox from '@material-ui/core/Checkbox';
import { Tooltip } from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

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
            Header: formatMessage({
<<<<<<< HEAD
                defaultMessage: 'Destination',
                id: 'iaso.label.destination',
            }),
            accessor: 'destination__source',
=======
                defaultMessage: 'Origin',
                id: 'iaso.label.origin',
            }),
            accessor: 'source__source',
>>>>>>> filters
            Cell: settings => (
                <span>
                    {`${formatMessage({
                        defaultMessage: 'Source',
                        id: 'iaso.label.source',
                    })}: ${settings.original.source.source}`}
                    <br />
                    {`${formatMessage({
                        defaultMessage: 'Version',
                        id: 'iaso.label.version',
                    })}: ${settings.original.source.version}`}
                </span>
            ),
        },
        {
            Header: formatMessage({
<<<<<<< HEAD
                defaultMessage: 'Origin',
                id: 'iaso.label.origin',
            }),
            accessor: 'source__source',
=======
                defaultMessage: 'Destination',
                id: 'iaso.label.destination',
            }),
            accessor: 'destination__source',
>>>>>>> filters
            Cell: settings => (
                <span>
                    {`${formatMessage({
                        defaultMessage: 'Source',
                        id: 'iaso.label.source',
                    })}: ${settings.original.destination.source}`}
                    <br />
                    {`${formatMessage({
                        defaultMessage: 'Version',
                        id: 'iaso.label.version',
                    })}: ${settings.original.destination.version}`}
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
                defaultMessage: 'Validator',
                id: 'iaso.label.validator',
            }),
            accessor: 'validator',
            Cell: settings => (
                settings.original.validator ? getDisplayName(settings.original.validator) : '/'
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
            expander: true,
            width: 65,
            // eslint-disable-next-line react/prop-types
            Expander: ({ isExpanded }) => (
                isExpanded
                    ? (
                        <VisibilityOff />
                    )
                    : (
                        <Tooltip title={formatMessage({
                            defaultMessage: 'Details',
                            id: 'iaso.label.details',
                        })}
                        >
                            <Visibility />
                        </Tooltip>
                    )
            ),
        },
    ]
);
export default linksTableColumns;
