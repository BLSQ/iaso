import React from 'react';

import TextField from '@mui/material/TextField';

import Autocomplete from '@mui/material/Autocomplete';

import throttle from 'lodash/throttle';

const fetchFrom = (
    input,
    filter,
    pageSize,
    resourceName,
    dataSourceId,
    fields,
) =>
    Promise.all([
        fetch(
            `/api/datasources/${dataSourceId}/${resourceName}.json?filter=name:ilike:${input}&fields=${
                fields || 'id,name'
            }&pageSize=${pageSize || 10}`,
        ).then(resp => resp.json()),
        fetch(
            `/api/datasources/${dataSourceId}/${resourceName}.json?filter=code:ilike:${input}&fields=${
                fields || 'id,name'
            }&pageSize=${pageSize || 10}`,
        ).then(resp => resp.json()),
        fetch(
            `/api/datasources/${dataSourceId}/${resourceName}.json?filter=id:eq:${input}&fields=${
                fields || 'id,name'
            }&pageSize=${pageSize || 10}`,
        ).then(resp => resp.json()),
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
    } = props;
    const fetchData = fetchFromPromise || fetchFrom;
    const [inputValue, setInputValue] = React.useState(defaultValue || '');

    const [options, setOptions] = React.useState([]);
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
                ).then(f => {
                    const union = f.flatMap(r => r[resourceName]);
                    const finalOptions = mapOptions
                        ? mapOptions(union, input.input)
                        : union;
                    setOptions(finalOptions);
                });
            }, 200),
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
                    onChange={handleChange}
                    value={inputValue}
                    variant="outlined"
                />
            )}
            renderOption={option => (
                <span name={name}>{option.displayName || option.name}</span>
            )}
        />
    );
};
export default Dhis2Search;
