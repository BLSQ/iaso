import React, { useState, useEffect, useCallback } from 'react';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { MESSAGES } from '../messages';

type Parameter = {
    type: string;
    code: string;
    name: string;
    default?: any;
    required?: boolean;
    choices?: any[];
};

type ParameterValues = Record<string, any>;

export const usePipelineParameters = (pipeline: any) => {
    const [parameterValues, setParameterValues] = useState<ParameterValues>({});
    const { formatMessage } = useSafeIntl();

    // Initialize parameter values when pipeline data is loaded
    useEffect(() => {
        if (pipeline?.currentVersion?.parameters) {
            const initialValues: ParameterValues = {};
            pipeline.currentVersion.parameters.forEach(
                (parameter: Parameter) => {
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
                        case 'list':
                            initialValues[parameter.code] =
                                parameter.default || [];
                            break;
                        case 'dict':
                            initialValues[parameter.code] =
                                parameter.default || {};
                            break;
                        default:
                            initialValues[parameter.code] =
                                parameter.default || null;
                    }
                },
            );
            setParameterValues(initialValues);
        }
    }, [pipeline]);

    // Handle parameter value changes
    const handleParameterChange = useCallback(
        (parameterName: string, value: any) => {
            setParameterValues(prev => ({
                ...prev,
                [parameterName]: value,
            }));
        },
        [],
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

    // Render parameter input based on type
    const renderParameterInput = useCallback(
        (parameter: Parameter) => {
            const currentValue = parameterValues[parameter.code];

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
                            min={0}
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
                            min={0}
                            placeholder={parameter.name}
                            onChange={(_, value) =>
                                handleParameterChange(parameter.code, value)
                            }
                        />
                    );
                case 'list':
                    return (
                        <InputComponent
                            type="select"
                            keyValue={parameter.code}
                            labelString={parameter.name}
                            value={currentValue || []}
                            required={parameter.required}
                            options={parameter.choices || []}
                            multi={true}
                            placeholder={`Select ${parameter.name}`}
                            onChange={(_, value) =>
                                handleParameterChange(parameter.name, value)
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
        ],
    );

    return {
        parameterValues,
        handleParameterChange,
        handleJsonChange,
        renderParameterInput,
    };
};
