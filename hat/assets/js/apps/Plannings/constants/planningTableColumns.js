import React from 'react';
import { FormattedMessage } from 'react-intl';
import moment from 'moment';

import { MONTHS_MESSAGES } from './monthsMessages';

export const planningTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage({
            defaultMessage: 'Name',
            id: 'main.label.name',
        }),
        accessor: 'name',
        className: 'small align-left',
        Cell: settings => (
            <span
                className={`${settings.original.is_template ? 'template' : ''}`}
            >
                <span>
                    {`${settings.original.is_template ? `${formatMessage({
                        defaultMessage: 'Template',
                        id: 'main.label.template',
                    })}: ` : ''}`}
                    {settings.original.name}
                </span>
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Year of application',
            id: 'main.management.planning.yearOfApplication',
        }),
        accessor: 'year',
        className: 'small',
        Cell: settings => (
            <span className={`${settings.original.is_template ? 'template' : ''}`}><span>{!settings.original.is_template ? settings.original.year : '--'}</span></span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Years coverage',
            id: 'main.management.planning.yearsCoverage',
        }),
        accessor: 'years_coverage',
        className: 'small',
        Cell: settings => (
            <span
                className={`${settings.original.is_template ? 'template' : ''}`}
            >
                <span>{settings.original.years_coverage ? settings.original.years_coverage.join(', ') : '--'}</span>
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Amount of months',
            id: 'main.management.planning.months',
        }),
        accessor: 'months',
        width: 120,
        className: 'small',
        Cell: settings => (
            <span
                className={`${settings.original.is_template ? 'template' : ''}`}
            >
                <span>{settings.original.months}</span>
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Starting month',
            id: 'main.management.planning.startingMonth',
        }),
        accessor: 'month',
        className: 'small',
        Cell: settings => (
            <span
                className={`${settings.original.is_template ? 'template' : ''}`}
            >
                <span>
                    {
                        formatMessage(MONTHS_MESSAGES[settings.original.month_start - 1])
                    }
                </span>
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Update date',
            id: 'main.label.updateDate',
        }),
        className: 'small',
        accessor: 'updated_at',
        Cell: settings => (
            <span className={`${settings.original.is_template ? 'template' : ''}`}><span>{moment(settings.original.updated_at).format('YYYY-MM-DD HH:mm')}</span></span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Actions',
            id: 'main.label.actions',
        }),
        sortable: false,
        resizable: false,
        width: 300,
        Cell: settings => (
            <section className={`${settings.original.is_template ? 'template' : ''}`}>
                <span>
                    <button
                        className="button--edit--tiny margin-right"
                        onClick={() => component.editPlanning(settings.original, true)}
                    >
                        <i className="fa fa-files-o" />
                        <FormattedMessage id="main.label.duplicate" defaultMessage="Copy" />
                    </button>
                    {
                        (!settings.original.is_template
                            || (settings.original.is_template && component.state.canMakeTemplate))
                        && (
                            <span>
                                <button
                                    className="button--edit--tiny margin-right"
                                    onClick={() => component.editPlanning(settings.original)}
                                >
                                    <i className="fa fa-pencil-square-o" />
                                    <FormattedMessage id="main.label.edit" defaultMessage="Edit" />
                                </button>
                            </span>
                        )
                    }
                    {
                        (!settings.original.is_template
                            || (settings.original.is_template && component.state.canMakeTemplate))
                        && (
                            <span>
                                <button
                                    className="button--delete--tiny"
                                    onClick={() => component.showDelete(settings.original)}
                                >
                                    <i className="fa fa-trash" />
                                    <FormattedMessage id="main.label.delete" defaultMessage="Delete" />
                                </button>
                            </span>
                        )
                    }
                </span>
            </section>
        ),
    },
];
