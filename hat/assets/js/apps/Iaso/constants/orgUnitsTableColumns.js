import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import Button from '@material-ui/core/Button';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';

const orgUnitsTableColumns = (formatMessage, component) => (
    [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'iaso.orgUnit.name',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'iaso.orgUnit.type',
            }),
            accessor: 'org_unit_type_id',
            Cell: settings => (
                <section>
                    {settings.original.org_unit_type_name}
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
                defaultMessage: 'Enregistrement(s)',
                id: 'iaso.form.records',
            }),
            resizable: false,
            width: 250,
            accessor: 'instances_count',
            Cell: settings => (
                <section>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => component.selectOrgUnit(settings.original)}
                    >
                        <RemoveRedEye className={component.props.classes.buttonIcon} fontSize="small" />
                        <FormattedMessage id="iaso.main.label.details" defaultMessage="Details" />
                    </Button>
                </section>
            ),
        },
    ]
);
export default orgUnitsTableColumns;
