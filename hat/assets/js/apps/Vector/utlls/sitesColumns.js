import moment from 'moment';
import React from 'react';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

const sitesColumns = (formatMessage, element) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'main.label.name',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Créateur',
                id: 'main.label.creator',
            }),
            accessor: 'creator',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Création',
                id: 'main.label.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.created_at).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Responsable',
                id: 'main.label.responsible',
            }),
            Cell: (settings) => {
                console.log('settings', settings);
                const truc = (
                    <section>
                        <Select
                            clearable
                            simpleValue
                            name="responsibleId"
                            value={settings.original.responsible_id}
                            placeholder="--"
                            options={element.props.profiles.map(profile =>
                                ({ label: profile.user__username, value: profile.id }))}
                            onChange={value => element.selectResponsible(settings.original, value)}
                        />
                    </section>
                );
                return truc;
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.actions',
            }),
            sortable: false,
            resizable: false,
            width: 220,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny"
                        onClick={() => element.editSite(settings.original)}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                    </button>
                </section>
            ),
        },
    ]
);
export default sitesColumns;

