
import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import moment from 'moment';
import Select from 'react-select';

const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'vector.labels.none',
    },
});

class TrapInfos extends PureComponent {
    render() {
        const {
            updateTrapField,
            trap,
            habitats,
            intl: {
                formatMessage,
            },
            getDetail,
            toggleModal,
        } = this.props;
        return (
            <div className="half-container">
                <div>
                    <div>
                        <label
                            htmlFor={`name-${trap.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.name"
                                defaultMessage="Nom"
                            />:
                        </label>
                        <input
                            type="text"
                            name="name"
                            id={`name-${trap.id}`}
                            className={(!trap.name || trap.name === '') ? 'form-error' : ''}
                            value={trap.name}
                            onChange={event => updateTrapField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div className="flex-container">
                        <label
                            htmlFor={`description-${trap.id}`}
                            className="filter__container__select__label textarea-label"
                        >
                            <FormattedMessage
                                id="main.label.description"
                                defaultMessage="Description"
                            />:
                        </label>
                        <textarea
                            name="description"
                            id={`description-${trap.id}`}
                            value={trap.description || ''}
                            onChange={event => updateTrapField('description', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`habitat-${trap.id}`}
                            className="filter__container__select__label select-label"
                        >
                            <FormattedMessage
                                id="vector.label.habitat"
                                defaultMessage="Habitat"
                            />:
                        </label>
                        <Select
                            multi={false}
                            simpleValue
                            autosize={false}
                            name="habitat"
                            value={trap.habitat}
                            placeholder={formatMessage(MESSAGES.none)}
                            options={habitats.map(h =>
                                ({ label: h[1], value: h[0] }))}
                            onChange={habitat => updateTrapField('habitat', habitat)}
                        />
                    </div>
                    <div className="flex-container">
                        <label
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="verctor.label.selected"
                                defaultMessage="Piège sélectionné"
                            />:
                        </label>
                        <section className="check-box-container">
                            <input
                                id={`selected-${trap.id}`}
                                type="radio"
                                name="selected"
                                checked={trap.is_selected ? 'checked' : ''}
                                value={trap.is_selected}
                                onChange={() => updateTrapField('is_selected', true)}
                            />
                            <label
                                htmlFor={`selected-${trap.id}`}
                                className="checkbox-label"
                            >
                                <FormattedMessage
                                    id="verctor.label.yes"
                                    defaultMessage="Oui"
                                />
                            </label>
                            <input
                                id={`selected-${trap.id}-false`}
                                type="radio"
                                name="selected"
                                checked={!trap.is_selected ? 'checked' : ''}
                                value={trap.is_selected}
                                onChange={() => updateTrapField('is_selected', false)}
                            />
                            <label
                                htmlFor={`selected-${trap.id}-false`}
                                className="checkbox-label"
                            >
                                <FormattedMessage
                                    id="verctor.label.no"
                                    defaultMessage="Non"
                                />
                            </label>
                        </section>
                    </div>
                    <div className="flex-container">
                        <label
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="verctor.label.ignore"
                                defaultMessage="Ignorer"
                            />:
                        </label>
                        <section className="check-box-container">
                            <input
                                id={`ignore-${trap.id}`}
                                type="radio"
                                name="ignore"
                                checked={trap.ignore ? 'checked' : ''}
                                value={trap.ignore}
                                onChange={() => updateTrapField('ignore', true)}
                            />
                            <label
                                htmlFor={`ignore-${trap.id}`}
                                className="checkbox-label"
                            >
                                <FormattedMessage
                                    id="verctor.label.yes"
                                    defaultMessage="Oui"
                                />
                            </label>
                            <input
                                id={`ignore-${trap.id}-false`}
                                type="radio"
                                name="ignore"
                                checked={!trap.ignore ? 'checked' : ''}
                                value={trap.ignore}
                                onChange={() => updateTrapField('ignore', false)}
                            />
                            <label
                                htmlFor={`ignore-${trap.id}-false`}
                                className="checkbox-label"
                            >
                                <FormattedMessage
                                    id="verctor.label.no"
                                    defaultMessage="Non"
                                />
                            </label>
                        </section>
                    </div>
                </div>
                <div>
                    <table>
                        <tbody>
                            <tr>
                                <th>UUID</th>
                                <td className="small">
                                    {trap.uuid}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.site"
                                        defaultMessage="Site"
                                    />
                                </th>
                                <td >
                                    {
                                        trap.site &&
                                        <Fragment>
                                            {trap.site.name}
                                            <button
                                                className="button--tiny margin-left"
                                                id="edit-button"
                                                onClick={() => {
                                                    toggleModal();
                                                    setTimeout(() => {
                                                        getDetail(trap.site.id, 'new_sites', 'showEditSiteModale');
                                                    }, 100);
                                                }}
                                            >
                                                <i className="fa fa-pencil-square-o" />
                                            </button>
                                        </Fragment>
                                    }
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.creation"
                                        defaultMessage="Création"
                                    />
                                </th>
                                <td>
                                    {moment(trap.created_at).format('DD/MM/YYYY HH:mm')}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.user"
                                        defaultMessage="Utilisateur"
                                    />
                                </th>
                                <td>
                                    {trap.username}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.latitude"
                                        defaultMessage="Latitude"
                                    />
                                </th>
                                <td>
                                    {trap.latitude}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.longitude"
                                        defaultMessage="Longitude"
                                    />
                                </th>
                                <td>
                                    {trap.longitude}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.altitude"
                                        defaultMessage="Altitude"
                                    />
                                </th>
                                <td>
                                    {trap.altitude}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.accuracy"
                                        defaultMessage="Précision"
                                    />
                                </th>
                                <td>{trap.accuracy ? trap.accuracy : '--'}</td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.source"
                                        defaultMessage="Source"
                                    />
                                </th>
                                <td>{trap.source}</td>
                            </tr>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id="vector.label.catches"
                                        defaultMessage="Déploiements"
                                    />
                                </th>
                                <td>{trap.catches_count}</td>
                            </tr>
                            {
                                trap.catches_count > 0 &&
                                <tr>
                                    <th>
                                        <FormattedMessage
                                            id="vector.label.male"
                                            defaultMessage="Males"
                                        />
                                    </th>
                                    <td>{trap.catches_count_male}</td>
                                </tr>
                            }
                            {
                                trap.catches_count > 0 &&
                                <tr>
                                    <th>
                                        <FormattedMessage
                                            id="vector.label.female"
                                            defaultMessage="Femelles"
                                        />
                                    </th>
                                    <td>{trap.catches_count_female}</td>
                                </tr>
                            }
                            {
                                trap.catches_count > 0 &&
                                <tr>
                                    <th>
                                        <FormattedMessage
                                            id="vector.label.unknown"
                                            defaultMessage="Inconnus"
                                        />
                                    </th>
                                    <td>{trap.catches_count_unknown}</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

TrapInfos.propTypes = {
    trap: PropTypes.object.isRequired,
    updateTrapField: PropTypes.func.isRequired,
    getDetail: PropTypes.func.isRequired,
    toggleModal: PropTypes.func.isRequired,
    habitats: PropTypes.array.isRequired,
    intl: PropTypes.object.isRequired,
};

const TrapsInfosWithIntl = injectIntl(TrapInfos);


export default (TrapsInfosWithIntl);
