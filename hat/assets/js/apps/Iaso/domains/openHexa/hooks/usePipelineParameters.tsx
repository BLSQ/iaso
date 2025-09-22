import React, { useEffect, useCallback } from 'react';
import { Typography } from '@mui/material';
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

export type ParameterValues = Record<string, any>;

export const usePipelineParameters = (
    pipeline?: any,
    parameterValues?: ParameterValues,
    setParameterValues?: React.Dispatch<
        React.SetStateAction<ParameterValues | undefined>
    >,
) => {
    const { formatMessage } = useSafeIntl();

    // Initialize parameter values when pipeline data is loaded
    useEffect(() => {
        if (pipeline?.currentVersion?.parameters) {
            const initialValues: ParameterValues = {};
            pipeline.currentVersion.parameters.forEach(
                (parameter: Parameter) => {
                    // Handle multiple parameters (arrays)
                    if (parameter.multiple) {
                        initialValues[parameter.code] = parameter.default || [];
                    } else {
                        switch (parameter.type) {
                            case 'str':
                                initialValues[parameter.code] =
                                    parameter.default || '';
                                break;
                            case 'bool':
                                initialValues[parameter.code] =
                                    parameter.default || false;
                                break;
                            case 'int':
                                initialValues[parameter.code] =
                                    parameter.default || 0;
                                break;
                            case 'float':
                                initialValues[parameter.code] =
                                    parameter.default || 0.0;
                                break;
                            case 'dict':
                                initialValues[parameter.code] =
                                    parameter.default || {};
                                break;
                            default:
                                initialValues[parameter.code] =
                                    parameter.default || null;
                        }
                    }
                },
            );
            setParameterValues?.(initialValues);
        }
    }, [pipeline, setParameterValues]);

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

    // Render parameter input based on type
    const renderParameterInput = useCallback(
        (parameter: Parameter) => {
            const currentValue = parameterValues?.[parameter.code];

            // Handle multiple parameters (arrays)
            if (parameter.multiple) {
                return (
                    <InputComponent
                        type="select"
                        keyValue={parameter.code}
                        labelString={parameter.name}
                        value={currentValue || []}
                        required={parameter.required}
                        options={
                            parameter?.choices?.map(choice => ({
                                label: `${choice}`,
                                value: choice,
                            })) || []
                        }
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
        ],
    );

    return {
        parameterValues,
        handleParameterChange,
        handleJsonChange,
        handleMultipleParameterChange,
        renderParameterInput,
    };
};
