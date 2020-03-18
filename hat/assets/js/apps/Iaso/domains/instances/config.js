/* globals window */
import React from 'react';
import Link from '@material-ui/core/Link';

import { Period } from '../periods/models';
import ColumnTextComponent from '../../components/tables/ColumnTextComponent';
import ViewRowButtonComponent from '../../components/buttons/ViewRowButtonComponent';
import { displayDateFromTimestamp } from '../../utils/intlUtil';
import MESSAGES from './messages';


const instancesTableColumns = (formatMessage = () => ({}), component) => (
    [
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: settings => (
                <section>
                    <ViewRowButtonComponent onClick={() => component.selectInstance(settings.original)} />
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            Cell: settings => (
                <span>
                    {displayDateFromTimestamp(settings.original.updated_at)}
                </span>
            ),
        }, {
            Header: formatMessage(MESSAGES.org_unit),
            accessor: 'org_unit__name',
            Cell: settings => (
                <ColumnTextComponent text={settings.original.org_unit
                    ? `${settings.original.org_unit.name} (${settings.original.org_unit.org_unit_type_name})`
                    : '/'}
                />
            ),
        },
        {
            Header: formatMessage(MESSAGES.period),
            accessor: 'period',
            Cell: settings => (
                <span>
                    {settings.original.period
                        ? `${Period.getPrettyPeriod(settings.original.period)}`
                        : '/'}
                </span>
            ),
        },
        {
            Header: formatMessage(MESSAGES.file),
            sortable: false,
            accessor: 'file_url',
            Cell: settings => (
                <span>
                    <Link
                        onClick={() => window.open(settings.original.file_url, '_blank')}
                        size="small"
                    >
                        XML
                    </Link>
                </span>
            ),
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            Cell: settings => (
                <span>
                    {displayDateFromTimestamp(settings.original.created_at)}
                </span>
            ),
        },
    ]
);

export default instancesTableColumns;
