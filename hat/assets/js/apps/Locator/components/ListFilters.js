import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { getPossibleYears } from '../../../utils';
import Search from '../../../components/Search';
import Filters from './Filters';


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
    searchPlaceholder: {
        defaultMessage: 'Recherche',
        id: 'listlocator.search.placeholder',
    },
    not_located: {
        defaultMessage: 'Pas encore localisés',
        id: 'listlocator.search.locationUnlocalized',
    },
    not_found: {
        defaultMessage: 'Marqués comme non trouvés',
        id: 'listlocator.search.locationUnfound',
    },
});


class ListFilters extends React.Component {
    toggleNormalized(value) {
        let { normalized } = this.props.params;
        if (normalized && normalized.length > 0) {
            normalized = null;
        } else if (value) {
            normalized = 'false';
        } else {
            normalized = 'true';
        }
        return (
            this.props.redirect({
                ...this.props.params,
                normalized,
            }));
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { years, teams, located } = this.props.params;
        const possibleYears = getPossibleYears();
        return (
            <div className="widget__content--tier">
                <div>
                    <span className="map__text--select">
                        <FormattedMessage
                            id="locator.list.textualsearch.label"
                            defaultMessage="Recherche textuelle"
                        />
                    </span>
                    <Search
                        placeholderText={formatMessage(MESSAGES.searchPlaceholder)}
                        allowEmptySearch
                        onSearch={value =>
                            this.props.redirect({
                                ...this.props.params, search: value,
                            })}
                        resetSearch={() => this.props.resetSearch()}
                        displayResults={false}
                        searchString={this.props.params.search}
                    />
                    <span className="map__text--select align-right">
                        <FormattedMessage
                            id="locator.list.normalized"
                            defaultMessage="AS déjà trouvée"
                        />
                        <input
                            type="checkbox"
                            name="with normalized as"
                            className="list--normalized-as-checkbox"
                            checked={this.props.params.normalized === 'true' || !this.props.params.normalized ? 'checked' : ''}
                            onChange={() => this.toggleNormalized(true)}
                        />
                    </span>
                    <span className="map__text--select align-right">
                        <FormattedMessage
                            id="locator.list.notnormalized"
                            defaultMessage="AS pas encore trouvée"
                        />
                        <input
                            type="checkbox"
                            name="without normalized as"
                            className="list--normalized-as-checkbox"
                            checked={this.props.params.normalized === 'false' || !this.props.params.normalized ? 'checked' : ''}
                            onChange={() => this.toggleNormalized(false)}
                        />
                    </span>
                </div>
                <div>
                    <div className="filter-item">
                        <div className="map__text--select filter-item-subtitle ">
                            <FormattedMessage
                                id="management.teams.title"
                                defaultMessage="Equipes"
                            />
                        </div>
                        <Select
                            multi
                            clearable
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
                    <div className="filter-item">
                        <div className="map__text--select filter-item-subtitle ">
                            <FormattedMessage
                                id="locator.list.years"
                                defaultMessage="Années"
                            />
                        </div>
                        <Select
                            multi
                            clearable
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
                    <div className="filter-item">
                        <div className="map__text--select filter-item-subtitle ">
                            <FormattedMessage
                                id="locator.list.location"
                                defaultMessage="Localisation"
                            />
                        </div>
                        <Select
                            clearable={false}
                            simpleValue
                            multi={false}
                            autosize={false}
                            name="location"
                            value={located}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={[
                                {
                                    label: formatMessage(MESSAGES.not_located),
                                    value: 'only_not_located',
                                },
                                {
                                    label: formatMessage(MESSAGES.not_found),
                                    value: 'only_not_located_and_not_found',
                                },
                            ]}
                            onChange={(location) => {
                                this.props.redirect({
                                    ...this.props.params, located: location,
                                });
                            }}
                        />
                    </div>
                </div>
                <div className="list-locator-filters">
                    <Filters
                        isMultiSelect={false} // need to update api to work with multiple ids
                        showVillages={false}
                        isClearable
                        filters={this.props.listFilters}
                        selectProvince={provindeId => this.props.selectProvince(provindeId)}
                        selectZone={zsId => this.props.selectZone(zsId)}
                        selectArea={asId => this.props.selectArea(asId)}
                    />
                </div>
            </div>
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
    resetSearch: PropTypes.func.isRequired,
    listFilters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
};

const ListFiltersWithIntl = injectIntl(ListFilters);


export default ListFiltersWithIntl;
