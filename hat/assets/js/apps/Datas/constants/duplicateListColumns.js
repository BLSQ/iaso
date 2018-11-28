import React from 'react';

const duplicateListColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Score de similarité',
                id: 'duplicate.label.similarity_score',
            }),
            accessor: 'similarity_score',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Algorithme',
                id: 'duplicate.label.algorithm',
            }),
            accessor: 'algorithm',
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Enregistrement',
                id: 'duplicate.label.patient',
            })} A`,
            accessor: 'patient1__last_name',
            Cell: settings => (
                <span>
                    {`${settings.original.patient1.last_name} ${settings.original.patient1.first_name}  ${settings.original.patient1.age} ${formatMessage({
                        defaultMessage: 'ans',
                        id: 'duplicate.label.years',
                    })}`}
                </span>
            ),
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Enregistrement',
                id: 'duplicate.label.patient',
            })} B`,
            accessor: 'patient2_°last_name',
            Cell: settings => (
                <span>
                    {`${settings.original.patient2.last_name} ${settings.original.patient2.first_name}  ${settings.original.patient2.age} ${formatMessage({
                        defaultMessage: 'ans',
                        id: 'duplicate.label.years',
                    })}`}
                </span>
            ),
        },
    ]
);
export default duplicateListColumns;
