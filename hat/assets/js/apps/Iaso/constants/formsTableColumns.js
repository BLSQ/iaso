import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import Button from '@material-ui/core/Button';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';

const formsTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'iaso.form.name',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Mise à jour',
                id: 'iaso.form.updated_at',
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
                defaultMessage: 'Création',
                id: 'iaso.form.created_at',
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
                id: 'iaso.form.type',
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
                defaultMessage: 'Enregistrement(s)',
                id: 'iaso.form.records',
            }),
            resizable: false,
            width: 250,
            accessor: 'instances_count',
            Cell: settings => (
                <section>
                    {
                        settings.original.instances_count
                        && (
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => component.selectForm(settings.original)}
                            >
                                <RemoveRedEye className={component.props.classes.tableIcon} fontSize="small" />
                                {settings.original.instances_count}
                            </Button>
                        )}
                    {
                        !settings.original.instances_count
                        && (
                            <FormattedMessage id='iaso.forms.noInstance' defaultMessage='Aucun enregistrement' />
                        )}
                </section>
            ),
        },
    ]
);
export default formsTableColumns;
