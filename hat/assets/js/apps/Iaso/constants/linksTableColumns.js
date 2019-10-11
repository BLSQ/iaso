import React from 'react';
import moment from 'moment';

const getStars = (score) => {
    const stars = [];

    for (let i = 0; i < score; i += 1) {
        stars.push(<i className="fa fa-star" key={`${i}-pos`} />);
    }
    for (let i = 0; i < (5 - score); i += 1) {
        stars.push(<i className="fa fa-star-o" key={`${i}-neg`} />);
    }
    return stars;
};

const linksTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Similarity score',
                id: 'iaso.label.similarity_score',
            }),
            accessor: 'similarity_score',
            Cell: (settings) => {
                let finalScore = 0;
                if (settings.original.similarity_score < 700) {
                    finalScore = Math.round(Math.abs(700 - settings.original.similarity_score) / 140);
                }
                return (
                    <div className="middle-align stars">
                        {
                            getStars(finalScore)
                        }
                        {
                            <span>
                                {`(${settings.original.similarity_score})`}
                            </span>
                        }
                    </div>
                );
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.label.name',
            }),
            accessor: 'destination__name',
            Cell: settings => (
                <span>
                    {settings.original.destination.name}
                    {' '}
                    /
                    {' '}
                    {settings.original.source.name}
                </span>
            ),
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Source',
                id: 'iaso.label.source',
            })} 1`,
            accessor: 'destination__source',
            Cell: settings => (
                <span>
                    {settings.original.destination.source}
                </span>
            ),
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Source',
                id: 'iaso.label.source',
            })} 2`,
            accessor: 'source__source',
            Cell: settings => (
                <span>
                    {settings.original.source.source}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.label.updated_at',
            }),
            accessor: 'updated_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.updated_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
                id: 'iaso.label.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
        },
    ]
);
export default linksTableColumns;
