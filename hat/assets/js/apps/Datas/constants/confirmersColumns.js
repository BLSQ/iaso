import React from 'react';

import { renderCountCell, getPourcentage, formatThousand } from '../../../utils';

const confirmersColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'monitoring.label.name',
            }),
            class: 'small',
            accessor: 'tester__user__last_name',
            Cell: settings => <span>{`${settings.original.tester__user__first_name} ${settings.original.tester__user__last_name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Tests de confirmation',
                id: 'monitoring.label.confirmation_count',
            }),
            class: 'small',
            accessor: 'confirmation_count',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_count, settings.original.positive_confirmation_test_count, formatMessage),
        },
        {
            Header: 'PG',
            class: 'small',
            accessor: 'pg_count',
            Cell: settings =>
                renderCountCell(settings.original.pg_count, settings.original.pg_count_positive, formatMessage),
        },
        {
            Header: 'MAECT',
            class: 'small',
            accessor: 'maect_count',
            Cell: settings =>
                renderCountCell(settings.original.maect_count, settings.original.maect_count_positive, formatMessage),
        },
        {
            Header: 'PL',
            class: 'small',
            accessor: 'pl_count',
            Cell: (settings) => {
                const total = settings.original.pg_count;
                const pourcentagePositive = getPourcentage(total, settings.original.pl_count_positive);
                const pourcentageStade1 = getPourcentage(total, settings.original.pl_count_stage1);
                const pourcentageStade2 = getPourcentage(total, settings.original.pl_count_stage2);
                return (
                    <span>
                        {formatThousand(total)}{' '}
                        {
                            pourcentagePositive !== 0 &&
                            total !== 0 &&
                            <span>
                                ({parseFloat(pourcentagePositive).toFixed(2)}% {formatMessage({
                                    defaultMessage: 'positifs',
                                    id: 'monitoring.label.positive',
                                })}
                                <span>
                                    , {parseFloat(pourcentageStade1).toFixed(2)}% {formatMessage({
                                        defaultMessage: 'stade',
                                        id: 'monitoring.label.stade',
                                    })}1
                                </span>
                                <span>
                                    , {parseFloat(pourcentageStade2).toFixed(2)}% {formatMessage({
                                        defaultMessage: 'stade',
                                        id: 'monitoring.label.stade',
                                    })}2)
                                </span>
                            </span>
                        }
                        {
                            pourcentagePositive === 0 &&
                            total !== 0 &&
                            <span>
                                ({formatMessage({
                                    defaultMessage: '0 positif',
                                    id: 'monitoring.label.no_positve',
                                })})
                            </span>
                        }
                        {
                            pourcentageStade2 === 0 &&
                            total !== 0 &&
                            pourcentagePositive !== 0 &&
                            <span>
                                ({formatMessage({
                                    defaultMessage: '0 stade',
                                    id: 'monitoring.label.no_positve_stade',
                                })}1)
                            </span>
                        }
                        {
                            pourcentageStade1 === 0 &&
                            total !== 0 &&
                            pourcentagePositive !== 0 &&
                            <span>
                                ({formatMessage({
                                    defaultMessage: '0 stade',
                                    id: 'monitoring.label.no_positve_stade',
                                })}2)
                            </span>
                        }
                    </span>
                );
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Vidéos',
                id: 'monitoring.label.vidéos',
            }),
            accessor: 'confirmation_video_count',
            class: 'small',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_video_count, settings.original.confirmation_positive_video_count, formatMessage),
        },
    ]
);
export default confirmersColumns;
