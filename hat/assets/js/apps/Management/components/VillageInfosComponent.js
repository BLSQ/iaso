
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl } from 'react-intl';
import { deepEqual } from '../../../utils';
import ArrayFieldInput from '../../../components/ArrayFieldInput';

class VillageInfosComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            village: props.village,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.village, this.props.village, true)) {
            this.setState({
                village: nextProps.village,
            });
        }
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            updateVillageField,
            villageSources,
        } = this.props;
        const { village } = this.state;
        return (
            <section className="half-container">
                <div>
                    <div>
                        <label
                            htmlFor={`name-${village.id}`}
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
                            id={`name-${village.id}`}
                            className={(!village.name || village.name === '') ? 'form-error' : ''}
                            value={village.name}
                            onChange={event => updateVillageField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`aliases-${village.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.aliases"
                                defaultMessage="Alias"
                            />:
                        </label>
                        <ArrayFieldInput
                            fieldList={village.aliases}
                            name={`aliases-${village.id}`}
                            baseId={`alias-${village.id}`}
                            updateList={list => updateVillageField('aliases', list)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${village.population}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.population"
                                defaultMessage="Population"
                            />:
                        </label>
                        <input
                            type="text"
                            name="name"
                            id={`name-${village.population}`}
                            value={village.population ? village.population : 0}
                            onChange={event => updateVillageField('population', parseInt(event.currentTarget.value, 10))}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor={`name-${village.village_official}`}
                            className="filter__container__select__label select-label"
                        >
                            <FormattedMessage
                                id="main.label.village_official"
                                defaultMessage="Officel"
                            />:
                        </label>
                        <Select
                            multi={false}
                            clearable={false}
                            simpleValue
                            name="village_official"
                            value={village.village_official}
                            className={!village.village_official ? 'form-error' : ''}
                            placeholder="--"
                            options={[
                                {
                                    label: formatMessage({
                                        defaultMessage: 'Villages officiels',
                                        id: 'management.village_official.YES',
                                    }),
                                    value: 'YES',
                                },
                                {
                                    label: formatMessage({
                                        defaultMessage: 'Villages non officiels',
                                        id: 'management.village_official.NO',
                                    }),
                                    value: 'NO',
                                },
                                {
                                    label: formatMessage({
                                        defaultMessage: 'Villages trouvés lors de campagne',
                                        id: 'management.village_official.OTHER',
                                    }),
                                    value: 'OTHER',
                                },
                                {
                                    label: formatMessage({
                                        defaultMessage: 'Villages issus d\'images satellite',
                                        id: 'management.village_official.NA',
                                    }),
                                    value: 'NA',
                                },
                            ]}
                            onChange={value => updateVillageField('village_official', value)}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <label
                            htmlFor={`village_type-${village.village_type}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.village_type"
                                defaultMessage="Type de village"
                            />:
                        </label>
                        <input
                            type="text"
                            name="village_type"
                            id={`village_type-${village.village_type}`}
                            value={village.village_type ? village.village_type : ''}
                            onChange={event => updateVillageField('village_type', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`village_source-${village.village_source}`}
                            className="filter__container__select__label  select-label"
                        >
                            <FormattedMessage
                                id="main.label.village_source"
                                defaultMessage="Source du village"
                            />:
                        </label>
                        <Select
                            multi={false}
                            clearable
                            simpleValue
                            name="village_source"
                            value={village.id === 0 ? 'manual' : village.village_source}
                            placeholder="--"
                            options={villageSources.map(v => ({ label: v[1], value: v[0] }))}
                            onChange={value => updateVillageField('village_source', value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`gps_source-${village.gps_source}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.gps_source"
                                defaultMessage="Source gps"
                            />:
                        </label>
                        <input
                            type="text"
                            name="gps_source"
                            id={`gps_source-${village.gps_source}`}
                            value={village.gps_source ? village.gps_source : ''}
                            onChange={event => updateVillageField('gps_source', event.currentTarget.value)}
                        />
                    </div>
                </div>
            </section>
        );
    }
}

VillageInfosComponent.propTypes = {
    village: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    updateVillageField: PropTypes.func.isRequired,
    villageSources: PropTypes.array.isRequired,
};

export default injectIntl(VillageInfosComponent);
