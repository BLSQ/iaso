import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { replace } from 'react-router-redux';
import PropTypes from 'prop-types';

import { createUrl } from '../../../../utils/fetchData';

import InputComponent from '../forms/InputComponent';

class FiltersComponent extends React.Component {
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
            this.props.onFilterChanged(value);
            redirectTo(baseUrl, newParams);
        }
    }

    onSearchChange(key, value, launchSearch = false) {
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

        this.props.onFilterChanged();
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
        this.props.onFilterChanged();
        redirectTo(baseUrl, newParams);
    }

    render() {
        const {
            filters, params, onEnterPressed,
        } = this.props;
        if (!filters) {
            return null;
        }
        return (
            <section>
                {
                    filters.map((filter) => {
                        let filterValue = filter.value || params[filter.urlKey];
                        if (filter.useKeyParam === false) {
                            filterValue = filter.value;
                        }
                        if (!filter.hideEmpty || (filter.hideEmpty && filter.options.length !== 0)) {
                            return (
                                <Fragment key={filter.urlKey}>
                                    {
                                        filter.type === 'select'
                                        && (
                                            <InputComponent
                                                multi={filter.isMultiSelect}
                                                clearable={filter.isClearable}
                                                disabled={filter.isDisabled || false}
                                                keyValue={filter.urlKey}
                                                onChange={(key, value) => this.onChange(filter.urlKey, value, filter.callback)}
                                                value={filterValue}
                                                type="select"
                                                options={filter.options}
                                                label={filter.label}
                                                labelString={filter.labelString}
                                            />
                                        )
                                    }

                                    {
                                        filter.type === 'search'
                                        && (
                                            <InputComponent
                                                disabled={filter.isDisabled || false}
                                                keyValue={filter.urlKey}
                                                onChange={(key, value) => this.onSearchChange(key, value, true)}
                                                value={filterValue}
                                                type="search"
                                                label={filter.label}
                                                onEnterPressed={onEnterPressed}
                                            />
                                        )
                                    }

                                    {
                                        filter.type === 'checkbox'
                                        && (
                                            <InputComponent
                                                disabled={filter.isDisabled || false}
                                                keyValue={filter.urlKey}
                                                onChange={(key, checked) => this.toggleCheckbox(checked, filter.urlKey)}
                                                checked={
                                                    this.props.params[filter.urlKey] === 'true'
                                                        ? 'checked' : ''
                                                }
                                                value={filterValue}
                                                type="checkbox"
                                                label={filter.label}
                                            />
                                        )
                                    }
                                </Fragment>
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
    onEnterPressed: () => null,
    onFilterChanged: () => null,
};

FiltersComponent.propTypes = {
    filters: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    baseUrl: PropTypes.string,
    onEnterPressed: PropTypes.func,
    onFilterChanged: PropTypes.func,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(replace(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(FiltersComponent);
