import React from 'react';
import moment from 'moment';
import { getAgeFromYear } from '../../../utils/index';

const registerListColumns = (formatMessage, component) => (
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
                        settings.original.sex === 'female'
                        && formatMessage({
                            defaultMessage: 'Femme',
                            id: 'main.label.female',
                        })
                    }
                    {
                        settings.original.sex === 'male'
                        && formatMessage({
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
            accessor: 'year_of_birth',
            className: 'small',
            Cell: settings => (
                <span>
                    {getAgeFromYear(settings.original.year_of_birth)}
                </span>
            ),
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
                        settings.original.province
                        && settings.original.province
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
                        settings.original.ZS
                        && settings.original.ZS
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
                        settings.original.AS
                        && settings.original.AS
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
                        settings.original.village
                        && settings.original.village
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Doublons',
                id: 'register.label.duplicate',
            }),
            sortable: false,
            resizable: false,
            className: 'small',
            width: 100,
            Cell: (settings) => {
                const { patientA, patientB } = component.props;
                const checked = (patientA && patientA.id === settings.original.id)
                || (patientB && patientB.id === settings.original.id);
                const disabled = !checked && patientA && patientB;
                return (
                    <div
                        className={`manual-duplicate__button ${disabled ? 'disabled' : ''}`}
                        tabIndex={0}
                        role="button"
                        onClick={() => {
                            if (disabled) {
                                return null;
                            }
                            return component.toggleManualDuplicate(settings.original);
                        }}
                    >
                        {
                            checked
                            && <i className="fa fa-check-square-o manual-duplicate__icon on" />
                        }
                        {
                            !checked
                            && <i className={`fa fa-square-o manual-duplicate__icon ${disabled ? 'disabled' : ''}`} />
                        }
                    </div>
                );
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.actions',
            }),
            sortable: false,
            resizable: false,
            width: 120,
            Cell: settings => (
                <section>
                    <button
                        type="button"
                        className="button--edit--tiny margin-right"
                        onClick={() => component.selectPatient(settings.original)}
                    >
                        <i className="fa fa-pencil-square-o" />
                        {formatMessage({
                            defaultMessage: 'Editer',
                            id: 'main.label.edit',
                        })}
                    </button>
                </section>
            ),
        },
    ]
);
export default registerListColumns;
