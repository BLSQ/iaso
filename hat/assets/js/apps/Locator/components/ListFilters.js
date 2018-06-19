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
        const { years, teams } = this.props.params;
        const possibleYears = getPossibleYears();
        return (
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
};

const ListFiltersWithIntl = injectIntl(ListFilters);


export default ListFiltersWithIntl;
