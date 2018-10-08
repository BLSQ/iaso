
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl } from 'react-intl';
import { deepEqual } from '../../../utils';

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
        } = this.props;
        return (
            <section className="half-container">
                <div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.village.id}`}
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
                            id={`name-${this.state.village.id}`}
                            value={this.state.village.name}
                            onChange={event => updateVillageField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.village.population}`}
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
                            id={`name-${this.state.village.population}`}
                            value={this.state.village.population ? this.state.village.population : 0}
                            onChange={event => updateVillageField('population', parseInt(event.currentTarget.value, 10))}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor={`name-${this.state.village.village_official}`}
                            className="filter__container__select__label select-label"
                        >
                            <FormattedMessage
                                id="main.label.village_official"
                                defaultMessage="Officel"
                            />:
                        </label>
                        <Select
                            multi={false}
                            clearable
                            simpleValue
                            name="village_official"
                            value={this.state.village.village_official}
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
            </section>
        );
    }
}

VillageInfosComponent.propTypes = {
    village: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    updateVillageField: PropTypes.func.isRequired,
};

export default injectIntl(VillageInfosComponent);
