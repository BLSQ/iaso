import React from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import throttle from 'lodash/throttle';

type Props = {
    resourceName: string;
    collectionName?: string;
    fields?: string;
    style?: React.CSSProperties;
    name?: string;
    label: string;
    // callers pass selected option objects (e.g. { id, name }), not only strings
    onChange: (name: any, value: any, resourceName?: any) => void;
    defaultValue?: string;
    mapOptions?: (options: any) => any;
    placeholder?: string;
};

type Option = {
    displayName: string;
    name: string;
};

const IasoSearchComponent = (props: Props) => {
    const {
        resourceName,
        collectionName,
        fields,
        style,
        name,
        label,
        onChange,
        defaultValue,
        mapOptions,
        placeholder,
    } = props;
    const [inputValue, setInputValue] = React.useState(defaultValue || '');

    const [options, setOptions] = React.useState([]);
    // TODO confirm it is dead code
    // const [selectedOption, setSelectedOption] = React.useState([]);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const fetchMemo = React.useMemo(
        () =>
            throttle(
                (
                    input: { input: string },
                    // Call sites may pass a callback; options are still set below.
                    _callback?: (results: any) => void,
                ) =>
                    fetch(
                        `/api/${resourceName}.json?search_name=${input.input}${
                            fields ? `&fields=${fields}` : ''
                        }`,
                    )
                        .then(resp => resp.json())
                        .then(f => {
                            const union = f[collectionName || resourceName];
                            const finalOptions = mapOptions
                                ? mapOptions(union)
                                : union;
                            setOptions(finalOptions);
                        }),
                200,
            ),
        [collectionName, fields, mapOptions, resourceName],
    );
    React.useEffect(() => {
        setInputValue(defaultValue as string);
    }, [setInputValue, defaultValue]);

    React.useEffect(() => {
        let active = true;
        if (inputValue === '') {
            setOptions([]);
            return undefined;
        }

        fetchMemo({ input: inputValue }, (results: any) => {
            if (active) {
                setOptions(results || []);
            }
        });

        return () => {
            active = false;
        };
    }, [inputValue, fetchMemo]);

    const onSearchChange = (
        _evt: React.SyntheticEvent,
        value: string | Option | null,
    ) => {
        onChange(name, value as string, resourceName);
        // TODO confirm this is dead code
        // setSelectedOption(value);
    };

    return (
        <Autocomplete
            style={style}
            getOptionLabel={(option: string | Option) =>
                typeof option === 'string'
                    ? option
                    : option.displayName || option.name
            }
            filterOptions={x => x}
            options={options}
            onChange={onSearchChange}
            autoComplete
            includeInputInList
            freeSolo
            defaultValue={defaultValue}
            renderInput={params => (
                <TextField
                    {...params}
                    style={{ marginTop: '30px' }}
                    name={name}
                    label={label}
                    variant="outlined"
                    fullWidth
                    onChange={handleChange}
                    value={inputValue}
                    placeholder={placeholder}
                />
            )}
            renderOption={(
                props: React.HTMLAttributes<HTMLLIElement>,
                option: Option,
            ) => <li {...props}>{option.displayName || option.name}</li>}
        />
    );
};
export default IasoSearchComponent;
