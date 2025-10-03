import React, { useCallback, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import { MESSAGES } from '../messages';

type Parameter = {
    type: string;
    code: string;
    name: string;
    default?: any;
    required?: boolean;
    choices?: any[];
    multiple?: boolean;
};

type ParameterValues = Record<string, any>;

type ParametersProps = {
    parameters?: Parameter[];
    parameterValues?: ParameterValues;
    setParameterValues?: React.Dispatch<
        React.SetStateAction<ParameterValues | undefined>
    >;
    setAllowConfirm?: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Parameters: React.FC<ParametersProps> = ({
    parameters,
    parameterValues,
    setParameterValues,
    setAllowConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    const allParamsFilled = useMemo(() => {
        return parameters
            ?.filter(parameter => parameter.required)
            .filter(parameter => parameter.type !== 'bool')
            .every(parameter => parameterValues?.[parameter.code]);
    }, [parameters, parameterValues]);
    useEffect(() => {
        if (setAllowConfirm) {
            setAllowConfirm(Boolean(allParamsFilled));
        }
    }, [allParamsFilled, setAllowConfirm]);
    // Handle parameter value changes
    const handleParameterChange = useCallback(
        (parameterName: string, value: any) => {
            setParameterValues?.(prev => ({
                ...prev,
                [parameterName]: value,
            }));
        },
        [setParameterValues],
    );

    // Handle JSON parsing for dict parameters
    const handleJsonChange = useCallback(
        (value: any, parameter: Parameter) => {
            try {
                const parsedValue = value ? JSON.parse(value) : {};
                handleParameterChange(parameter.code, parsedValue);
            } catch {
                // If JSON is invalid, store as string for now
                handleParameterChange(parameter.code, value);
            }
        },
        [handleParameterChange],
    );

    // Handle multiple parameter value conversion
    const handleMultipleParameterChange = useCallback(
        (parameter: Parameter, value: any) => {
            // Convert values to appropriate type based on base type
            const convertValue = (val: any) => {
                switch (parameter.type) {
                    case 'int':
                        return parseInt(val, 10);
                    case 'float':
                        return parseFloat(val);
                    case 'str':
                    default:
                        return String(val);
                }
            };

            const arrayValue = commaSeparatedIdsToArray(value);
            const convertedValue = arrayValue.map(convertValue);
            handleParameterChange(parameter.code, convertedValue);
        },
        [handleParameterChange],
    );

    const getOptions = useCallback((parameter: Parameter) => {
        return (
            parameter?.choices?.map(choice => ({
                label: `${choice}`,
                value: choice,
            })) || []
        );
    }, []);
    // Get default value for a parameter based on its type
    const getDefaultValueForParameter = useCallback((parameter: Parameter) => {
        if (parameter.multiple) {
            return parameter.default || [];
        }

        switch (parameter.type) {
            case 'str':
                return parameter.default || '';
            case 'bool':
                return parameter.default || false;
            case 'int':
                return parameter.default || 0;
            case 'float':
                return parameter.default || 0.0;
            case 'dict':
                return parameter.default || {};
            default:
                return parameter.default || null;
        }
    }, []);
    useEffect(() => {
        if (parameters) {
            const initialValues: ParameterValues = {};
            parameters.forEach((parameter: Parameter) => {
                initialValues[parameter.code] =
                    getDefaultValueForParameter(parameter);
            });
            setParameterValues?.(initialValues);
        }
    }, [parameters, setParameterValues, getDefaultValueForParameter]);

    // Render parameter input based on type
    const renderParameterInput = useCallback(
        (parameter: Parameter) => {
            const currentValue = parameterValues?.[parameter.code];

            if (parameter.multiple) {
                return (
                    <InputComponent
                        type="select"
                        keyValue={parameter.code}
                        labelString={parameter.name}
                        value={currentValue || []}
                        required={parameter.required}
                        options={getOptions(parameter)}
                        multi={true}
                        placeholder={`Select ${parameter.name}`}
                        onChange={(_, value) =>
                            handleMultipleParameterChange(parameter, value)
                        }
                    />
                );
            }

            switch (parameter.type) {
                case 'str':
                    return (
                        <InputComponent
                            type="text"
                            keyValue={parameter.code}
                            labelString={parameter.name}
                            value={currentValue || ''}
                            required={parameter.required}
                            placeholder={parameter.name}
                            onChange={(_, value) =>
                                handleParameterChange(parameter.code, value)
                            }
                        />
                    );
                case 'bool':
                    return (
                        <InputComponent
                            type="checkbox"
                            keyValue={parameter.code}
                            labelString={parameter.name}
                            value={currentValue || false}
                            required={parameter.required}
                            onChange={(_, value) =>
                                handleParameterChange(parameter.code, value)
                            }
                        />
                    );
                case 'int':
                    return (
                        <InputComponent
                            type="number"
                            keyValue={parameter.code}
                            labelString={parameter.name}
                            value={currentValue || 0}
                            required={parameter.required}
                            placeholder={parameter.name}
                            onChange={(_, value) =>
                                handleParameterChange(parameter.code, value)
                            }
                        />
                    );
                case 'float':
                    return (
                        <InputComponent
                            type="number"
                            keyValue={parameter.code}
                            labelString={parameter.name}
                            value={currentValue || 0.0}
                            required={parameter.required}
                            placeholder={parameter.name}
                            onChange={(_, value) =>
                                handleParameterChange(parameter.code, value)
                            }
                        />
                    );
                case 'dict':
                    return (
                        <InputComponent
                            type="textarea"
                            keyValue={parameter.code}
                            labelString={parameter.name}
                            value={
                                currentValue
                                    ? JSON.stringify(currentValue, null, 2)
                                    : '{}'
                            }
                            required={parameter.required}
                            multiline={true}
                            placeholder={parameter.name}
                            onChange={(_key, value) =>
                                handleJsonChange(value, parameter)
                            }
                        />
                    );
                default:
                    return (
                        <Typography
                            key={parameter.code}
                            variant="body2"
                            color="text.secondary"
                        >
                            {formatMessage(MESSAGES.unknownParameterType)}:{' '}
                            {parameter.type}
                        </Typography>
                    );
            }
        },
        [
            parameterValues,
            handleParameterChange,
            handleJsonChange,
            formatMessage,
            handleMultipleParameterChange,
            getOptions,
        ],
    );

    if (!parameters || parameters.length === 0) {
        return (
            <Box>
                <Typography variant="body2" color="text.secondary">
                    No parameters available
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {parameters.map(parameter => (
                <Box key={parameter.code}>
                    {renderParameterInput(parameter)}
                </Box>
            ))}
        </Box>
    );
};

export default Parameters;
