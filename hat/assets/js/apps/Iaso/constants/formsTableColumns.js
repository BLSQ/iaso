import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import Button from '@material-ui/core/Button';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';

const formsTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.forms.name',
            }),
            accessor: 'name',
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
            resizable: false,
            width: 250,
            accessor: 'instances_count',
            Cell: settings => (
                <section>
                    {
                        settings.original.instances_count > 0
                        && (
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => component.selectForm(settings.original)}
                            >
                                <RemoveRedEye className={component.props.classes.buttonIcon} fontSize="small" />
                                {settings.original.instances_count}
                            </Button>
                        )}
                    {
                        !settings.original.instances_count
                        && (
                            <FormattedMessage id="iaso.forms.noInstance" defaultMessage="No record" />
                        )}
                </section>
            ),
        },
    ]
);
export default formsTableColumns;
