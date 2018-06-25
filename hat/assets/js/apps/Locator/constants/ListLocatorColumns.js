
import React from 'react';

const listLocatorColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Année du formulaire',
                id: 'locator.label.form_year',
            }),
            accessor: 'form_year',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Unité',
                id: 'microplanning.label.team',
            }),
            accessor: 'mobile_unit',
        },
        {
            Header: formatMessage({
                defaultMessage: 'N° de formulaire',
                id: 'locator.label.form_number',
            }),
            accessor: 'form_number',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'microplanning.tooltip.province',
            }),
            accessor: 'province',
        },
        {
            Header: 'ZS',
            accessor: 'ZS',
        },
        {
            Header: 'AS',
            accessor: 'AS',
        },
        {
            Header: 'AS match',
            accessor: 'normalized_AS_name',
            sortable: false,
            Cell: settings => (
                <span className={!settings.original.normalized_AS_name ? 'bullet' : ''} > {settings.original.normalized_AS_name} </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'microplanning.tooltip.village',
            }),
            accessor: 'village',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'main.label.name',
            }),
            accessor: 'source',
        },
    ]
);
export default listLocatorColumns;
