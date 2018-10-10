import React from 'react';
import { formatThousand } from '../../../utils';

const MESSAGES = {
    YES: {
        defaultMessage: 'Officiel',
        id: 'main.label.postive',
    },
    NO: {
        defaultMessage: 'Non officiel',
        id: 'main.label.NO',
    },
    OTHER: {
        defaultMessage: 'Campagne',
        id: 'main.label.OTHER',
    },
    NA: {
        defaultMessage: 'Satellite',
        id: 'main.label.NA',
    },
};

const villagesTableColumns = (
    formatMessage,
    component,
) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'main.label.name',
            }),
            width: 250,
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Population',
                id: 'main.label.population',
            }),
            className: 'small',
            accessor: 'population',
            Cell: settings => (
                <section>
                    {formatThousand(settings.original.population)}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Cas positifs',
                id: 'main.label.nr_positive_cases',
            }),
            className: 'small',
            accessor: 'nr_positive_cases',
            Cell: settings => (
                <section>
                    {formatThousand(settings.original.nr_positive_cases)}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'main.label.province',
            }),
            className: 'small',
            sortable: true,
            accessor: 'AS__ZS__province__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Zone',
                id: 'main.label.ZS.singular',
            }),
            className: 'small',
            sortable: true,
            accessor: 'AS__ZS__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Aire',
                id: 'main.label.AS.singular',
            }),
            className: 'small',
            sortable: true,
            accessor: 'AS__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'main.label.village_type',
            }),
            className: 'small',
            accessor: 'village_type',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Officiel',
                id: 'main.label.village_official',
            }),
            className: 'small',
            accessor: 'village_official',
            Cell: settings => (
                <section>
                    {formatMessage(MESSAGES[settings.original.village_official])}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source gps',
                id: 'main.label.gps_source',
            }),
            className: 'small',
            accessor: 'gps_source',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.actions',
            }),
            sortable: false,
            resizable: false,
            width: 200,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny  margin-right"
                        onClick={() =>
                            component.props.selectVillage(settings.original)}
                    >
                        <i className="fa fa-pencil-square-o" />
                        {
                            formatMessage({
                                defaultMessage: 'Editer',
                                id: 'main.label.edit',
                            })
                        }
                    </button>
                    <button
                        className="button--delete--tiny"
                        onClick={() =>
                            component.setState({
                                showDeleteModale: true,
                                dataDeleted: settings.original,
                            })}
                    >
                        <i className="fa fa-trash" />
                        {
                            formatMessage({
                                defaultMessage: 'Effacer',
                                id: 'main.label.delete',
                            })
                        }
                    </button>
                </section>
            ),
        },
    ]
);
export default villagesTableColumns;
