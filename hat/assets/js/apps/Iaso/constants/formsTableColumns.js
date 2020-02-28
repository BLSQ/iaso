import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import Link from '@material-ui/core/Link';
import { IconButton, Tooltip } from '@material-ui/core';
import Delete from '@material-ui/icons/Delete';

const formsTableColumns = (formatMessage, component, classes) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.forms.name',
            }),
            accessor: 'name',
            className: 'justify-left',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.forms.updated_at',
            }),
            accessor: 'instance_updated_at',
            Cell: settings => (
                <section>
                    {settings.original.instance_updated_at
                        && moment(settings.original.instance_updated_at).format('DD/MM/YYYY HH:mm')}
                    {!settings.original.instance_updated_at
                        && '/'}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
                id: 'iaso.forms.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'iaso.forms.type',
            }),
            sortable: false,
            accessor: 'org_unit_types',
            Cell: settings => (
                <section>
                    {
                        settings.original.org_unit_types.map((o, index) => `${index > 0 ? ', ' : ''}${o.short_name}`)
                    }
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Record(s)',
                id: 'iaso.forms.records',
            }),
            accessor: 'instances_count',
            Cell: settings => (
                <section>
                    {
                        settings.original.instances_count > 0
                        && settings.original.instances_count}
                    {
                        !settings.original.instances_count
                        && (
                            <FormattedMessage id="iaso.forms.noInstance" defaultMessage="No record" />
                        )}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Action(s)',
                id: 'iaso.forms.actions',
            }),
            resizable: false,
            width: 250,
            sortable: false,
            Cell: settings => (
                <section>
                    <Tooltip
                        classes={{
                            popper: classes.popperFixed,
                        }}
                        title={<FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />}
                    >
                        <IconButton
                            onClick={() => component.deleteForm(settings.original)}
                        >
                            <Delete />
                        </IconButton>
                    </Tooltip>
                    {
                        settings.original.instances_count > 0
                        && (
                            <Link
                                size="small"
                                onClick={() => component.selectForm(settings.original)}
                            >
                                <FormattedMessage id="iaso.forms.view" defaultMessage="View" />
                            </Link>
                        )
                    }
                </section>
            ),
        },
    ]
);
export default formsTableColumns;
