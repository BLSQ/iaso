import React from 'react';

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

const duplicateListColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Score de similarité',
                id: 'duplicate.label.similarity_score',
            }),
            accessor: 'similarity_score',
            Cell: (settings) => {
                let finalScore = 0;
                // 700/5
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
            Header: `${formatMessage({
                defaultMessage: 'Enregistrement',
                id: 'duplicate.label.patient',
            })} A`,
            accessor: 'patient1__last_name',
            Cell: settings => (
                <ul className="align-right duplicate-infos">
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Nom',
                                id: 'duplicate.label.name',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.last_name !== settings.original.patient2.last_name ? 'error' : ''}`}>
                            {settings.original.patient1.last_name}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Postnom',
                                id: 'duplicate.label.post_nom',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.post_name !== settings.original.patient2.post_name ? 'error' : ''}`}>
                            {settings.original.patient1.post_name}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Prénom',
                                id: 'duplicate.label.first_name',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.first_name !== settings.original.patient2.first_name ? 'error' : ''}`}>
                            {settings.original.patient1.first_name}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Nom de la mère',
                                id: 'duplicate.label.mothers_surname',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.mothers_surname !== settings.original.patient2.mothers_surname ? 'error' : ''}`}>
                            {settings.original.patient1.mothers_surname}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Age',
                                id: 'duplicate.label.age',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.age !== settings.original.patient2.age ? 'error' : ''}`}>
                            {settings.original.patient1.age}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Sexe',
                                id: 'duplicate.label.sex',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.sex !== settings.original.patient2.sex ? 'error' : ''}`}>
                            {
                                settings.original.patient1.sex === 'female' &&
                                formatMessage({
                                    defaultMessage: 'Femme',
                                    id: 'main.label.female',
                                })
                            }
                            {
                                settings.original.patient1.sex === 'male' &&
                                formatMessage({
                                    defaultMessage: 'Homme',
                                    id: 'main.label.male',
                                })
                            }
                            {
                                settings.original.patient1.sex !== 'male' && settings.original.patient1.sex !== 'female' &&
                                '--'
                            }
                        </span>
                    </li>

                </ul>
            ),
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Enregistrement',
                id: 'duplicate.label.patient',
            })} B`,
            accessor: 'patient2__last_name',
            Cell: settings => (
                <ul className="align-left duplicate-infos">
                    <li>
                        <span className={`${settings.original.patient1.last_name !== settings.original.patient2.last_name ? 'error' : ''}`}>
                            {settings.original.patient2.last_name}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.post_name !== settings.original.patient2.post_name ? 'error' : ''}`}>
                            {settings.original.patient2.post_name}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.first_name !== settings.original.patient2.first_name ? 'error' : ''}`}>
                            {settings.original.patient2.first_name}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.mothers_surname !== settings.original.patient2.mothers_surname ? 'error' : ''}`}>
                            {settings.original.patient2.mothers_surname}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.age !== settings.original.patient2.age ? 'error' : ''}`}>
                            {settings.original.patient2.age}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.sex !== settings.original.patient2.sex ? 'error' : ''}`}>
                            {
                                settings.original.patient2.sex === 'female' &&
                                formatMessage({
                                    defaultMessage: 'Femme',
                                    id: 'main.label.female',
                                })
                            }
                            {
                                settings.original.patient2.sex === 'male' &&
                                formatMessage({
                                    defaultMessage: 'Homme',
                                    id: 'main.label.male',
                                })
                            }
                            {
                                settings.original.patient2.sex !== 'male' && settings.original.patient2.sex !== 'female' &&
                                '--'
                            }
                        </span>
                    </li>
                </ul>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Algorithme',
                id: 'duplicate.label.algorithm',
            }),
            accessor: 'algorithm',
            Cell: settings => (
                <div className="middle-align">
                    {
                        settings.original.algorithm
                    }
                </div>
            ),
        },
    ]
);
export default duplicateListColumns;
