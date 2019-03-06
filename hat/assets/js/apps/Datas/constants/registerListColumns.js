import React from 'react';
import moment from 'moment';

const registerListColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Dernière modif.',
                id: 'register.label.updated_at',
            }),
            accessor: 'updated_at',
            className: 'small',
            Cell: settings => (
                <span>
                    {moment(settings.original.updated_at).format('DD-MM-YYYY HH:mm')}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'register.label.name',
            }),
            accessor: 'last_name',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Postnom',
                id: 'register.label.Postnom',
            }),
            accessor: 'post_name',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Prénom',
                id: 'register.label.prename',
            }),
            accessor: 'first_name',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom de la mère',
                id: 'register.label.mothers_surname',
            }),
            accessor: 'mothers_surname',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Sexe',
                id: 'register.label.sex',
            }),
            accessor: 'sex',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.sex === 'female' &&
                        formatMessage({
                            defaultMessage: 'Femme',
                            id: 'main.label.female',
                        })
                    }
                    {
                        settings.original.sex === 'male' &&
                        formatMessage({
                            defaultMessage: 'Homme',
                            id: 'main.label.male',
                        })
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Age',
                id: 'register.label.age',
            }),
            accessor: 'age',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'register.label.province',
            }),
            accessor: 'origin_area__ZS__province__name',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.province &&
                        settings.original.province
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Zone',
                id: 'register.label.zone',
            }),
            accessor: 'origin_area__ZS_name',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.ZS &&
                        settings.original.ZS
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Aire',
                id: 'register.label.area',
            }),
            accessor: 'origin_area__name',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.AS &&
                        settings.original.AS
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'register.label.village',
            }),
            accessor: 'origin_village__name',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.village &&
                        settings.original.village
                    }
                </span>
            ),
        },
    ]
);
export default registerListColumns;
