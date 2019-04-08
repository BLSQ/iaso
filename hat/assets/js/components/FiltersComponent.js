import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { injectIntl } from 'react-intl';
import Search from './Search';

import { createUrl } from '../utils/fetchData';
import { userHasPermission } from '../utils';

const anonymisedFilterArray = [
    'search_prename',
    'search_name',
    'search_lastname',
    'search_mother_name',
];

class FiltersComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    onChange(urlKey, value, callback) {
        if (callback) {
            callback(value);
        } else {
            const {
                params,
                redirectTo,
                baseUrl,
            } = this.props;
            const newParams = {
                ...params,
            };
            newParams[urlKey] = value;
            redirectTo(baseUrl, newParams);
        }
    }

    onSearchChange(value, key, launchSearch = false) {
        const newState = Object.assign({}, this.state, { [key]: value });
        this.setState(newState);
        if (launchSearch) {
            this.onSearch(newState);
        }
    }

    onSearch(state = this.state) {
        const {
            params,
            redirectTo,
            baseUrl,
        } = this.props;
        const newParams = {
            ...params,
        };
        Object.keys(state).map((objectKey) => {
            const value = state[objectKey];
            newParams[objectKey] = value;
            return null;
        });

        redirectTo(baseUrl, newParams);
    }

    toggleCheckbox(checked, urlKey) {
        const {
            params,
            redirectTo,
            baseUrl,
        } = this.props;
        const newParams = {
            ...params,
        };
        if (checked) {
            newParams[urlKey] = 'true';
        } else if (newParams[urlKey]) {
            delete newParams[urlKey];
        }
        redirectTo(baseUrl, newParams);
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            filters, params, currentUser, permissions,
        } = this.props;
        if (!filters) {
            return null;
        }
        return (
            <section>
                {
                    filters.map((filter) => {
                        const searchDisabled = userHasPermission(permissions, currentUser, 'x_anonymous', false) &&
                            anonymisedFilterArray.indexOf(filter.name) !== -1;

                        if (!filter.hideEmpty || (filter.hideEmpty && filter.options.length !== 0)) {
                            return (
                                <div key={filter.name}>
                                    <div className="filter-item">
                                        {
                                            filter.type !== 'checkbox' &&
                                            <div className="filter-item-subtitle ">
                                                {formatMessage(filter.label)}
                                            </div>
                                        }
                                        {
                                            filter.type === 'select' &&
                                            <Select
                                                multi={filter.isMultiSelect}
                                                clearable={filter.isClearable}
                                                simpleValue
                                                name={filter.name}
                                                value={filter.value || params[filter.urlKey]}
                                                placeholder={formatMessage(filter.placeholder)}
                                                options={filter.options.map(item =>
                                                    ({ label: item.label || item.name, value: item.value || item.id }))}
                                                onChange={value => this.onChange(filter.urlKey, value, filter.callback)}
                                                className={filter.className ? filter.className : ''}
                                                disabled={filter.isDisabled || false}
                                            />
                                        }

                                        {
                                            filter.type === 'search' &&
                                            <Search
                                                placeholderText={formatMessage(filter.placeholder)}
                                                allowEmptySearch={filter.allowEmptySearch}
                                                showResetSearch={filter.showResetSearch}
                                                onSearch={() => this.onSearch()}
                                                resetSearch={() => this.onSearchChange('', filter.urlKey, true)}
                                                displayResults={filter.displayResults}
                                                searchString={params[filter.urlKey]}
                                                resetOnUnmount={false}
                                                onChange={value => this.onSearchChange(value, filter.urlKey)}
                                                disabled={searchDisabled}
                                                displayIcon={filter.displayIcon}
                                                onKeyPressed={filter.onKeyPressed}
                                            />
                                        }

                                        {
                                            filter.type === 'checkbox' &&
                                            <span className="filter-checkbox">
                                                <label htmlFor={`checkbox-${filter.urlKey}`}>
                                                    {formatMessage(filter.label)}
                                                </label>
                                                <input
                                                    id={`checkbox-${filter.urlKey}`}
                                                    type="checkbox"
                                                    name={`checkbox-${filter.urlKey}`}
                                                    className="list--normalized-as-checkbox"
                                                    checked={
                                                        (this.props.params[filter.urlKey] === 'true') ||
                                                            (filter.conditionnalCheck && this.props.params[filter.conditionnalCheck])
                                                            ? 'checked' : ''
                                                    }
                                                    onChange={event => this.toggleCheckbox(event.target.checked, filter.urlKey)}
                                                />
                                            </span>
                                        }
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })
                }
            </section>
        );
    }
}
FiltersComponent.defaultProps = {
    baseUrl: '',
};

FiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    filters: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    baseUrl: PropTypes.string,
    currentUser: PropTypes.object.isRequired,
    permissions: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    currentUser: state.currentUser ? state.currentUser.user : {},
    permissions: state.currentUser ? state.currentUser.permissions : [],
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const FiltersComponentIntl = injectIntl(FiltersComponent);

export default connect(MapStateToProps, MapDispatchToProps)(FiltersComponentIntl);

