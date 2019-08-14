import React from 'react';
import moment from 'moment';
import { getAgeFromYear } from '../../../utils/index';

const registerListColumns = (formatMessage, component, hasDuplicatePermission) => {
    const columns =
        [
            {
                Header: formatMessage({
                    defaultMessage: 'Updated at',
                    id: 'main.label.updated_at',
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
                    defaultMessage: 'Name',
                    id: 'main.label.name',
                }),
                accessor: 'last_name',
                className: 'small',
            },
            {
                Header: formatMessage({
                    defaultMessage: 'Post name',
                    id: 'main.label.postName',
                }),
                accessor: 'post_name',
                className: 'small',
            },
            {
                Header: formatMessage({
                    defaultMessage: 'First name',
                    id: 'main.label.firstName',
                }),
                accessor: 'first_name',
                className: 'small',
            },
            {
                Header: formatMessage({
                    defaultMessage: 'Mother surname',
                    id: 'main.label.mothers_surname',
                }),
                accessor: 'mothers_surname',
                className: 'small',
            },
            {
                Header: formatMessage({
                    defaultMessage: 'Sex',
                    id: 'main.label.sex',
                }),
                accessor: 'sex',
                className: 'small',
                Cell: settings => (
                    <span>
                        {
                            settings.original.sex === 'female'
                            && formatMessage({
                                defaultMessage: 'Female',
                                id: 'main.label.female',
                            })
                        }
                        {
                            settings.original.sex === 'male'
                            && formatMessage({
                                defaultMessage: 'Male',
                                id: 'main.label.male',
                            })
                        }
                    </span>
                ),
            },
            {
                Header: formatMessage({
                    defaultMessage: 'Age',
                    id: 'main.label.age',
                }),
                accessor: 'year_of_birth',
                className: 'small',
                Cell: settings => (
                    <span>
                        {settings.original.year_of_birth ? getAgeFromYear(settings.original.year_of_birth) : '--'}
                    </span>
                ),
            },
            {
                Header: formatMessage({
                    defaultMessage: 'Province',
                    id: 'main.label.province',
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
                    id: 'main.label.zone_short',
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
                    defaultMessage: 'Area',
                    id: 'main.label.area_short',
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
                    id: 'main.label.village',
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
                    defaultMessage: 'Actions',
                    id: 'main.label.actions',
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
        ];
    if (hasDuplicatePermission) {
        columns.push({
            Header: formatMessage({
                defaultMessage: 'Doublons',
                id: 'main.label.duplicates',
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
        });
    }
    return columns;
};
export default registerListColumns;
