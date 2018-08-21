
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { deepEqual } from '../../../utils';


const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucune',
        id: 'management.none',
    },
});

class UserInfosComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: props.user,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.user, this.props.user, true)) {
            this.setState({
                user: nextProps.user,
            });
        }
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            provinces,
            zones,
            areas,
        } = this.props;
        return (
            <section>
                <div>
                    <label
                        htmlFor="province"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.province"
                            defaultMessage="Province"
                        />:
                    </label>
                    <Select
                        multi
                        simpleValue
                        name="provinceId"
                        value={this.state.user.province}
                        placeholder={formatMessage(MESSAGES.none)}
                        options={provinces.map(province =>
                            ({ label: province.name, value: province.id }))}
                        onChange={provincesId => this.props.updateUserField('province', provincesId.length > 0 ? provincesId.split(',') : [])}
                    />
                </div>
                {
                    this.state.user.province.length > 0 &&
                    <div>
                        <label
                            htmlFor="zones"
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.zones"
                                defaultMessage="Zones"
                            />:
                        </label>
                        <Select
                            multi
                            simpleValue
                            name="zoneIds"
                            value={this.state.user.ZS}
                            placeholder={formatMessage(MESSAGES.none)}
                            options={zones.map(zone =>
                                ({ label: zone.name, value: zone.id }))}
                            onChange={zoneIds => this.props.updateUserField('ZS', zoneIds.length > 0 ? zoneIds.split(',') : [])}
                        />
                    </div>
                }
                {
                    this.state.user.ZS.length > 0 && this.state.user.province.length > 0 &&
                    <div>
                        <label
                            htmlFor="areas"
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.areas"
                                defaultMessage="Aires"
                            />:
                        </label>
                        <Select
                            multi
                            simpleValue
                            name="areaIds"
                            value={this.state.user.AS}
                            placeholder={formatMessage(MESSAGES.none)}
                            options={areas.map(area =>
                                ({ label: area.name, value: area.id }))}
                            onChange={areaIds => this.props.updateUserField('AS', areaIds.length ? areaIds.split(',') : [])}
                        />
                    </div>
                }
            </section>
        );
    }
}

UserInfosComponent.propTypes = {
    user: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    updateUserField: PropTypes.func.isRequired,
    provinces: PropTypes.array.isRequired,
    zones: PropTypes.array.isRequired,
    areas: PropTypes.array.isRequired,
};

export default injectIntl(UserInfosComponent);
