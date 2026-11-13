import React from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import throttle from 'lodash/throttle';
import {
    DHIS2_UNAVAILABLE,
    Dhis2SearchError,
    Dhis2SearchErrorMessage,
    fetchDhis2Resource,
} from './Dhis2SearchError';

const fetchFrom = (
    input,
    filter,
    pageSize,
    resourceName,
    dataSourceId,
    fields,
) =>
    Promise.all([
        fetchDhis2Resource(
            `/api/datasources/${dataSourceId}/${resourceName}.json?filter=name:ilike:${input}&fields=${
                fields || 'id,name'
            }&pageSize=${pageSize || 10}`,
        ),
        fetchDhis2Resource(
            `/api/datasources/${dataSourceId}/${resourceName}.json?filter=code:ilike:${input}&fields=${
                fields || 'id,name'
            }&pageSize=${pageSize || 10}`,
        ),
        fetchDhis2Resource(
            `/api/datasources/${dataSourceId}/${resourceName}.json?filter=id:eq:${input}&fields=${
                fields || 'id,name'
            }&pageSize=${pageSize || 10}`,
        ),
    ]);
const Dhis2Search = props => {
    const {
        dataSourceId,
        resourceName,
        fields,
        style,
        name,
        label,
        onChange,
        filter,
        pageSize,
        defaultValue,
        mapOptions,
        fetchFromPromise,
        disabled,
        placeholder,
    } = props;
    const fetchData = fetchFromPromise || fetchFrom;
    const [inputValue, setInputValue] = React.useState(defaultValue || '');

    const [options, setOptions] = React.useState([]);
    const [errorCode, setErrorCode] = React.useState<string | undefined>();
    // TODO confirm this is dead code
    // const [_selectedOption, setSelectedOption] = React.useState([]);
    const handleChange = event => {
        setInputValue(event.target.value);
    };

    const fetchMemo = React.useMemo(
        () =>
            throttle(input => {
                fetchData(
                    input.input,
                    filter,
                    pageSize,
                    resourceName,
                    dataSourceId,
                    fields,
                )
                    .then(f => {
                        const union = f.flatMap(r => r[resourceName]);
                        const finalOptions = mapOptions
                            ? mapOptions(union, input.input)
                            : union;
                        setErrorCode(undefined);
                        setOptions(finalOptions);
                    })
                    .catch(error => {
                        setOptions([]);
                        setErrorCode(
                            error instanceof Dhis2SearchError
                                ? error.code
                                : DHIS2_UNAVAILABLE,
                        );
                    });
            }, 200),
        // I guess we only want to run this once, so eslint disable is fine
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    React.useEffect(() => {
        setInputValue(defaultValue);
    }, [setInputValue, defaultValue]);

    React.useEffect(() => {
        let active = true;
        if (inputValue === '') {
            setOptions([]);
            return undefined;
        }

        fetchMemo({ input: inputValue }, results => {
            if (active) {
                setOptions(results || []);
            }
        });

        return () => {
            active = false;
        };
    }, [inputValue, fetchMemo]);

    const onSearchChange = (evt, value) => {
        onChange(name, value, resourceName);
        // TODO confirm this is dead code
        // setSelectedOption(value);
    };

    return (
        <Autocomplete
            style={style}
            getOptionLabel={option =>
                typeof option === 'string'
                    ? option
                    : option.displayName || option.name
            }
            filterOptions={x => x}
            options={options}
            disabled={disabled}
            onChange={onSearchChange}
            openOnFocus={options.length > 0}
            autoComplete
            includeInputInList
            freeSolo
            defaultValue={defaultValue}
            renderInput={params => (
                <TextField
                    {...params}
                    style={{ marginTop: '30px' }}
                    name={name}
                    label={label || resourceName}
                    fullWidth
                    placeholder={placeholder}
                    onChange={handleChange}
                    value={inputValue}
                    variant="outlined"
                    error={Boolean(errorCode)}
                    helperText={
                        errorCode && (
                            <Dhis2SearchErrorMessage
                                code={errorCode}
                                dataSourceId={dataSourceId}
                            />
                        )
                    }
                />
            )}
            renderOption={(props, option) => (
                <li {...props} name={name}>
                    {option.displayName || option.name}
                </li>
            )}
        />
    );
};
export default Dhis2Search;
