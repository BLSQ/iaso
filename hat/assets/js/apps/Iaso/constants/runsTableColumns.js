import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';

import { formatThousand } from '../../../utils';
import getDisplayName from '../utils/usersUtils';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import DeleteDialog from '../components/dialogs/DeleteDialogComponent';

const runsTableColumns = (formatMessage, component) => (
    [
        {
            Header: 'ID',
            accessor: 'id',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Stopped at',
                id: 'iaso.label.ended_at',
            }),
            accessor: 'ended_at',
            Cell: settings => (
                <span>
                    {settings.original.ended_at
                        ? moment.unix(settings.original.ended_at).format('DD/MM/YYYY HH:mm')
                        : <LoadingSpinner fixed={false} transparent padding={4} size={25} />
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Launched at',
                id: 'iaso.label.launched_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.label.name',
            }),
            accessor: 'algorithm__name',
            Cell: settings => (
                <span>
                    {settings.original.algorithm.name}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Launcher',
                id: 'iaso.label.launcher',
            }),
            accessor: 'launcher',
            Cell: settings => (
                <span>
                    {settings.original.launcher ? getDisplayName(settings.original.launcher) : '/'}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Links',
                id: 'iaso.label.links',
            }),
            accessor: 'result',
            Cell: settings => (
                <span>
                    {settings.original.result ? formatThousand(settings.original.result['items matched']) : '/'}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Origin',
                id: 'iaso.label.origin',
            }),
            accessor: 'version_2',
            Cell: settings => (
                <span>
                    {`${formatMessage({
                        defaultMessage: 'Source',
                        id: 'iaso.label.source',
                    })}: ${settings.original.version_2.data_source.name}`}
                    <br />
                    {`${formatMessage({
                        defaultMessage: 'Version',
                        id: 'iaso.label.version',
                    })}: ${settings.original.version_2.number}`}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Destination',
                id: 'iaso.label.destination',
            }),
            accessor: 'version_1',
            Cell: settings => (
                <span>
                    {`${formatMessage({
                        defaultMessage: 'Source',
                        id: 'iaso.label.source',
                    })}: ${settings.original.version_1.data_source.name}`}
                    <br />
                    {`${formatMessage({
                        defaultMessage: 'Version',
                        id: 'iaso.label.version',
                    })}: ${settings.original.version_1.number}`}
                </span>
            ),
        },
        {
            resizable: false,
            sortable: false,
            width: 100,
            Cell: settings => (
                <section>
                    <DeleteDialog
                        disabled={Boolean(!settings.original.ended_at)}
                        question={(
                            <FormattedMessage
                                id="iaso.runs.dialog.deleteRunTitle"
                                defaultMessage="Are you sure you want to delete this run?"
                            />
                        )}
                        message={(
                            <FormattedMessage
                                id="iaso.runs.dialog.deleteRunText"
                                defaultMessage="All links created will be deleted"
                            />
                        )}
                        confirm={() => component.deleteRuns(settings.original)}
                    />
                </section>
            ),
        },
    ]
);
export default runsTableColumns;
