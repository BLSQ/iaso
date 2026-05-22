import React, { Fragment, useCallback, FunctionComponent } from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { useObjectState } from '../../hooks/useObjectState.js';
import InputComponent from '../forms/InputComponent.js';

type Props = {
    filters?: any[];
    params: Record<string, string>;
    baseUrl?: string;
    onEnterPressed?: () => void;
    onFilterChanged?: (value?: any, urlKey?: string) => void;
    redirectOnChange?: boolean;
};

export const FiltersComponent: FunctionComponent<Props> = ({
    params,
    baseUrl = '',
    filters,
    redirectOnChange = true,
    onFilterChanged = () => null,
    onEnterPressed = () => null,
}) => {
    const [state, setState] = useObjectState();
    const redirectToReplace = useRedirectToReplace();

    const onChange = useCallback(
        (urlKey, value, callback) => {
            if (callback) {
                callback(value, urlKey);
            } else {
                const newParams = {
                    ...params,
                };
                newParams[urlKey] = value;
                onFilterChanged(value, urlKey);
                if (redirectOnChange) {
                    redirectToReplace(baseUrl, newParams);
                }
            }
        },
        [baseUrl, onFilterChanged, params, redirectOnChange, redirectToReplace],
    );

    const onSearch = useCallback(
        stateArg => {
            const s = stateArg ?? state;
            const newParams = {
                ...params,
            };
            Object.keys(state).forEach(objectKey => {
                const value = s[objectKey];
                newParams[objectKey] = value;
            });

            onFilterChanged();
            redirectToReplace(baseUrl, newParams);
        },
        [baseUrl, onFilterChanged, params, redirectToReplace, state],
    );

    const onSearchChange = useCallback(
        (urlKey, value, launchSearch = false, callback) => {
            if (callback) {
                callback(value, urlKey);
            } else {
                const newState = { ...state, [urlKey]: value };
                setState(newState);
                if (launchSearch) {
                    onSearch(newState);
                }
            }
        },
        [onSearch, setState, state],
    );

    const toggleCheckbox = useCallback(
        (checked, urlKey, filter) => {
            const newParams = {
                ...params,
            };
            if (checked) {
                newParams[urlKey] = 'true';
            } else if (filter.checkedIfNull) {
                newParams[urlKey] = 'false';
            } else if (newParams[urlKey]) {
                delete newParams[urlKey];
            }
            onFilterChanged(newParams[urlKey], urlKey);
            if (redirectOnChange) {
                redirectToReplace(baseUrl, newParams);
            }
        },
        [baseUrl, onFilterChanged, params, redirectOnChange, redirectToReplace],
    );

    if (!filters) {
        return null;
    }

    return (
        <section>
            {filters.map(filter => {
                let filterValue = filter.value || params[filter.urlKey] || '';

                if (filter.useKeyParam === false) {
                    filterValue = filter.value;
                }
                if (!filterValue && filter.defaultValue) {
                    filterValue = filter.defaultValue;
                }
                if (filter.loading) {
                    filterValue = undefined;
                }
                if (
                    !filter.hideEmpty ||
                    (filter.hideEmpty && filter.options.length !== 0)
                ) {
                    return (
                        <Fragment key={filter.uid ? filter.uid : filter.urlKey}>
                            {filter.type === 'number' && (
                                <InputComponent
                                    keyValue={filter.urlKey}
                                    onChange={(key, value) =>
                                        onChange(
                                            filter.urlKey,
                                            value,
                                            filter.callback,
                                        )
                                    }
                                    value={filterValue}
                                    type="number"
                                    label={filter.label}
                                    withMarginTop={filter.withMarginTop}
                                />
                            )}
                            {filter.type === 'select' && (
                                <InputComponent
                                    loading={filter.loading}
                                    multi={filter.isMultiSelect}
                                    clearable={filter.isClearable}
                                    disabled={filter.isDisabled || false}
                                    keyValue={filter.urlKey}
                                    onChange={(key, value) =>
                                        onChange(
                                            filter.urlKey,
                                            value,
                                            filter.callback,
                                        )
                                    }
                                    value={
                                        filter.loading ? undefined : filterValue
                                    }
                                    type="select"
                                    options={filter.options}
                                    label={filter.label}
                                    labelString={filter.labelString}
                                    getOptionSelected={filter.getOptionSelected}
                                    getOptionLabel={filter.getOptionLabel}
                                    renderOption={filter.renderOption}
                                    withMarginTop={filter.withMarginTop}
                                />
                            )}

                            {filter.type === 'search' && (
                                <InputComponent
                                    disabled={filter.isDisabled || false}
                                    keyValue={filter.urlKey}
                                    uid={filter.uid}
                                    onChange={(key, value) =>
                                        onSearchChange(
                                            key,
                                            value,
                                            true,
                                            filter.callback,
                                        )
                                    }
                                    value={filterValue}
                                    type="search"
                                    label={filter.label}
                                    withMarginTop={filter.withMarginTop}
                                    onEnterPressed={onEnterPressed}
                                />
                            )}

                            {filter.type === 'checkbox' && ( // TODO: check with team
                                <InputComponent
                                    withMarginTop={filter.withMarginTop}
                                    disabled={filter.isDisabled || false}
                                    keyValue={filter.urlKey}
                                    onChange={(key, checked) =>
                                        toggleCheckbox(
                                            checked,
                                            filter.urlKey,
                                            filter,
                                        )
                                    }
                                    value={
                                        params[filter.urlKey] === 'true' ||
                                        (params[filter.urlKey] === undefined &&
                                            filter.checkedIfNull)
                                    }
                                    type="checkbox"
                                    label={filter.label}
                                />
                            )}
                        </Fragment>
                    );
                }
                return null;
            })}
        </section>
    );
};
