import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { getPossibleYears } from '../../../utils';
import Search from './Search';


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
        const { years, teams } = this.props.params;
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
                    <span className="map__text--select">
                        <FormattedMessage
                            id="management.teams.title"
                            defaultMessage="Equipes"
                        />
                    </span>
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
                <div>
                    <span className="map__text--select">
                        <FormattedMessage
                            id="locator.list.years"
                            defaultMessage="Années"
                        />
                    </span>
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
};

const ListFiltersWithIntl = injectIntl(ListFilters);


export default ListFiltersWithIntl;
