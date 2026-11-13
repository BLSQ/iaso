import React, { FunctionComponent, ReactNode } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

import throttle from 'lodash/throttle';
import {
    DHIS2_UNAVAILABLE,
    Dhis2SearchError,
    Dhis2SearchErrorMessage,
    fetchDhis2Resource,
} from './Dhis2SearchError';

type Option = {
    displayName?: string;
    name?: string;
    [key: string]: any;
};

type Props = {
    dataSourceId: number | string;
    resourceName: string;
    fields?: string;
    style?: React.CSSProperties;
    name?: string;
    label?: ReactNode;
    // callers often ignore name/resourceName; keep loose for compatibility
    onChange: (name: any, value: any, resourceName?: any) => void;
    filter?: string;
    pageSize?: number;
    defaultValue?: string;
    mapOptions?: (options: any, input?: string) => any;
    fetchFromPromise?: (
        input: any,
        filter: any,
        pageSize: any,
        resourceName: any,
        dataSourceId: any,
        fields: any,
    ) => Promise<any[]>;
    disabled?: boolean;
    placeholder?: string;
    // accepted by some call sites; Autocomplete uses defaultValue today
    value?: any;
};

const fetchFrom = (
    input: string,
    filter: string | undefined,
    pageSize: number | undefined,
    resourceName: string,
    dataSourceId: number | string,
    fields: string | undefined,
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

const Dhis2Search: FunctionComponent<Props> = props => {
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

    const [options, setOptions] = React.useState<Option[]>([]);
    const [errorCode, setErrorCode] = React.useState<string | undefined>();
    // TODO confirm this is dead code
    // const [_selectedOption, setSelectedOption] = React.useState([]);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    // the throttled fetch is created once: it reads the current props from
    // this ref, else it keeps searching the data source of the first render
    const latestProps = React.useRef({
        fetchData,
        filter,
        pageSize,
        resourceName,
        dataSourceId,
        fields,
        mapOptions,
    });
    latestProps.current = {
        fetchData,
        filter,
        pageSize,
        resourceName,
        dataSourceId,
        fields,
        mapOptions,
    };

    const fetchMemo = React.useMemo(
        () =>
            throttle(
                (
                    input: { input: string },
                    // Call sites may pass a callback; options are still set below.
                    _callback?: (results: any) => void,
                ) => {
                    const current = latestProps.current;
                    current
                        .fetchData(
                            input.input,
                            current.filter,
                            current.pageSize,
                            current.resourceName,
                            current.dataSourceId,
                            current.fields,
                        )
                        .then((f: any[]) => {
                            const union = f.flatMap(
                                (r: any) => r[current.resourceName],
                            );
                            const finalOptions = current.mapOptions
                                ? current.mapOptions(union, input.input)
                                : union;
                            setErrorCode(undefined);
                            setOptions(finalOptions);
                        })
                        .catch((error: unknown) => {
                            setOptions([]);
                            setErrorCode(
                                error instanceof Dhis2SearchError
                                    ? error.code
                                    : DHIS2_UNAVAILABLE,
                            );
                        });
                },
                200,
            ),
        [],
    );
    React.useEffect(() => {
        setErrorCode(undefined);
        setOptions([]);
    }, [dataSourceId]);
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
        onChange(name, value, resourceName);
        // TODO confirm this is dead code
        // setSelectedOption(value);
    };

    return (
        <Autocomplete
            style={style}
            getOptionLabel={(option: string | Option) =>
                typeof option === 'string'
                    ? option
                    : option.displayName || option.name || ''
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
                                dataSourceId={Number(dataSourceId)}
                            />
                        )
                    }
                />
            )}
            renderOption={(
                liProps: React.HTMLAttributes<HTMLLIElement>,
                option: Option,
            ) => (
                <li {...liProps}>{option.displayName || option.name}</li>
            )}
        />
    );
};
export default Dhis2Search;
