import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { injectIntl, FormattedMessage } from 'react-intl';

import FiltersComponent from '../../../components/FiltersComponent';
import { createUrl } from '../../../utils/fetchData';
import SearchButton from '../../../components/SearchButton';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import {
    users,
    teams,
    habitats,
    provinces,
    zones,
    aires,
    onlySelectedTraps,
    onlyIgnoredTraps,
    onlyIgnoredTargets,
} from '../../../utils/constants/filters';
import { MESSAGES } from '../utlls/vectorMapUtils';

const baseUrl = 'map';

class VectorFiltersComponent extends PureComponent {
    render() {
        const {
            params,
            redirectTo,
            profiles,
            intl: {
                formatMessage,
            },
            filters,
        } = this.props;
        return (
            <div className="widget__container">
                <div className="widget__header">
                    <h2 className="widget__heading inline-block width-auto margin-right small-padding-top">
                        <FormattedMessage
                            id="vector.label.period"
                            defaultMessage="Période d'activité"
                        />:{' '}
                    </h2>
                    <PeriodSelectorComponent
                        dateFrom={params.dateFrom}
                        dateTo={params.dateTo}
                        onChangeDate={(dateFrom, dateTo) =>
                            redirectTo(baseUrl, {
                                ...params,
                                dateFrom,
                                dateTo,
                            })}
                    />
                </div>
                <div className="widget__content--tier">
                    <div>
                        <FiltersComponent
                            params={this.props.params}
                            baseUrl={baseUrl}
                            filters={[
                                users(profiles),
                                teams(this.props.teams),
                                habitats(formatMessage, MESSAGES, this.props.habitats),
                            ]}
                        />
                    </div>
                    <div>
                        <FiltersComponent
                            params={this.props.params}
                            baseUrl={baseUrl}
                            filters={[
                                onlySelectedTraps(),
                                onlyIgnoredTraps(),
                                onlyIgnoredTargets(),
                            ]}
                        />
                    </div>
                    <div>
                        <FiltersComponent
                            params={this.props.params}
                            baseUrl={baseUrl}
                            filters={[
                                provinces(filters.provinces || [], this.props, baseUrl),
                                zones(filters.zones || [], this.props, baseUrl),
                                aires(filters.areas || [], this.props, baseUrl),
                            ]}
                        />
                    </div>
                </div>
                <SearchButton onSearch={() => this.props.onSearch()} />
            </div>
        );
    }
}

VectorFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
    teams: PropTypes.array.isRequired,
    habitats: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const MapStateToProps = state => ({
    profiles: state.vectors.profiles,
    teams: state.vectors.teams,
    habitats: state.vectors.habitats,
    filters: state.geoFilters,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(VectorFiltersComponent));
