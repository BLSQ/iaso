import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { getPossibleYears } from '../../../utils';


const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'microplanning.labels.all',
    },
    'years-select': {
        defaultMessage: 'Select years',
        id: 'microplanning.labels.years.select',
    },
    loading: {
        defaultMessage: 'Chargement en cours',
        id: 'microplanning.labels.loading',
    },
});


class ListFilters extends React.Component {
    render() {
        const { formatMessage } = this.props.intl;
        const zsId = this.props.params.zs_id;
        const asId = this.props.params.as_id;
        const provinceID = this.props.params.province_id;
        const { years, teams } = this.props.params;
        const possibleYears = getPossibleYears();
        return (
            <section>
                <div className="widget__content--tier">
                    <div>
                        <span className="map__text--select">
                            <FormattedMessage
                                id="management.teams.title"
                                defaultMessage="Equipes"
                            />
                        </span>
                        <Select
                            multi
                            simpleValue
                            autosize={false}
                            name="teams"
                            value={teams || ''}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={this.props.filters.teams.map(team =>
                                ({ label: team.name, value: team.id }))}
                            onChange={newTeamsId =>
                                this.props.redirect({
                                    ...this.props.params, teams: newTeamsId,
                                })}
                        />
                    </div>
                    <div>
                        <span className="map__text--select">
                            <FormattedMessage
                                id="locator.list.years"
                                defaultMessage="Années"
                            />
                        </span>
                        <Select
                            multi
                            simpleValue
                            autosize={false}
                            name="years"
                            value={years || ''}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={possibleYears.map(year =>
                                ({ label: year, value: year }))}
                            onChange={(yearsList) => {
                                this.props.redirect({
                                    ...this.props.params, years: yearsList,
                                });
                            }}
                        />
                    </div>
                </div>
                <div className="widget__content--tier">
                    <div>
                        <span className="map__text--select">
                            <FormattedMessage
                                id="locator.list.provinces"
                                defaultMessage="Provinces"
                            />
                        </span>
                        <Select
                            multi
                            simpleValue
                            autosize={false}
                            disabled={this.props.filters.provinces.length === 0}
                            name="zs_id"
                            value={provinceID ? provinceID.split(',').map(province => parseInt(province, 10)) : ''}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={this.props.filters.provinces.map(province =>
                                ({ label: province.old_name !== '' ? `${province.name} - ${province.old_name}` : province.name, value: province.id }))}
                            onChange={newProvinceId =>
                                this.props.redirect({
                                    ...this.props.params, province_id: newProvinceId,
                                })}
                        />
                    </div>
                    <div>
                        <span className="map__text--select">
                            <FormattedMessage
                                id="microplanning.filter.zones"
                                defaultMessage="Zones de santé"
                            />
                        </span>
                        <Select
                            multi
                            simpleValue
                            autosize={false}
                            disabled={this.props.filters.zones.length === 0}
                            name="zs_id"
                            value={zsId ? zsId.split(',').map(zs => parseInt(zs, 10)) : ''}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={this.props.filters.zones.map(zs =>
                                ({ label: zs.name, value: zs.id }))}
                            onChange={newProvinceId =>
                                this.props.redirect({
                                    ...this.props.params, zs_id: newProvinceId,
                                })}
                        />

                    </div>
                    <div>
                        <span className="map__text--select">
                            <FormattedMessage
                                id="microplanning.filter.area"
                                defaultMessage="Aires de santé"
                            />
                        </span>
                        <Select
                            multi
                            simpleValue
                            autosize={false}
                            disabled={this.props.filters.zones.length === 0}
                            name="as_id"
                            value={asId ? asId.split(',').map(as => parseInt(as, 10)) : ''}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={this.props.filters.areas.map(as =>
                                ({ label: as.name, value: as.id }))}
                            onChange={newAreasId =>
                                this.props.redirect({
                                    ...this.props.params, as_id: newAreasId,
                                })}
                        />

                    </div>
                </div>
            </section>
        );
    }
}

ListFilters.defaultProps = {
    params: {},
};

ListFilters.propTypes = {
    intl: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
    redirect: PropTypes.func.isRequired,
    params: PropTypes.object,
};

const ListFiltersWithIntl = injectIntl(ListFilters);


export default ListFiltersWithIntl;
