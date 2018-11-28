import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { injectIntl } from 'react-intl';
import Search from './Search';

import { createUrl } from '../utils/fetchData';


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

    render() {
        const { formatMessage } = this.props.intl;
        const { filters, params } = this.props;
        if (!filters) {
            return null;
        }
        return (
            <section>
                {
                    filters.map((filter) => {
                        if (!filter.hideEmpty || (filter.hideEmpty && filter.options.length !== 0)) {
                            return (
                                <div key={filter.name}>
                                    <div className="filter-item">
                                        <div className="filter-item-subtitle ">
                                            {formatMessage(filter.label)}
                                        </div>
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
                                            />
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
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const FiltersComponentIntl = injectIntl(FiltersComponent);

export default connect(MapStateToProps, MapDispatchToProps)(FiltersComponentIntl);

