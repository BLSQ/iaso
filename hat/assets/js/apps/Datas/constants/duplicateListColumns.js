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
                defaultMessage: 'Similarity score',
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
                id: 'main.label.record',
            })} A`,
            accessor: 'patient1__last_name',
            Cell: settings => (
                <ul className="align-right duplicate-infos">
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Name',
                                id: 'main.label.name',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.last_name !== settings.original.patient2.last_name ? 'error-text' : ''}`}>
                            {settings.original.patient1.last_name}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Post name',
                                id: 'main.label.postName',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.post_name !== settings.original.patient2.post_name ? 'error-text' : ''}`}>
                            {settings.original.patient1.post_name}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'First name',
                                id: 'main.label.firstName',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.first_name !== settings.original.patient2.first_name ? 'error-text' : ''}`}>
                            {settings.original.patient1.first_name}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Mother surname',
                                id: 'main.label.mothers_surname',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.mothers_surname !== settings.original.patient2.mothers_surname ? 'error-text' : ''}`}>
                            {settings.original.patient1.mothers_surname}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Year of birth',
                                id: 'main.label.year_of_birth',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.year_of_birth !== settings.original.patient2.year_of_birth ? 'error-text' : ''}`}>
                            {settings.original.patient1.year_of_birth}
                        </span>
                    </li>
                    <li>
                        <strong>
                            {`${formatMessage({
                                defaultMessage: 'Sex',
                                id: 'main.label.sex',
                            })}: `}
                        </strong>
                        <span className={`${settings.original.patient1.sex !== settings.original.patient2.sex ? 'error-text' : ''}`}>
                            {
                                settings.original.patient1.sex === 'female' &&
                                formatMessage({
                                    defaultMessage: 'Female',
                                    id: 'main.label.female',
                                })
                            }
                            {
                                settings.original.patient1.sex === 'male' &&
                                formatMessage({
                                    defaultMessage: 'Male',
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
                defaultMessage: 'Record',
                id: 'main.label.record',
            })} B`,
            accessor: 'patient2__last_name',
            Cell: settings => (
                <ul className="align-left duplicate-infos">
                    <li>
                        <span className={`${settings.original.patient1.last_name !== settings.original.patient2.last_name ? 'error-text' : ''}`}>
                            {settings.original.patient2.last_name}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.post_name !== settings.original.patient2.post_name ? 'error-text' : ''}`}>
                            {settings.original.patient2.post_name}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.first_name !== settings.original.patient2.first_name ? 'error-text' : ''}`}>
                            {settings.original.patient2.first_name}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.mothers_surname !== settings.original.patient2.mothers_surname ? 'error-text' : ''}`}>
                            {settings.original.patient2.mothers_surname}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.year_of_birth !== settings.original.patient2.year_of_birth ? 'error-text' : ''}`}>
                            {settings.original.patient2.year_of_birth}
                        </span>
                    </li>
                    <li>
                        <span className={`${settings.original.patient1.sex !== settings.original.patient2.sex ? 'error-text' : ''}`}>
                            {
                                settings.original.patient2.sex === 'female' &&
                                formatMessage({
                                    defaultMessage: 'Female',
                                    id: 'main.label.female',
                                })
                            }
                            {
                                settings.original.patient2.sex === 'male' &&
                                formatMessage({
                                    defaultMessage: 'Male',
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
                defaultMessage: 'Algorith',
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
