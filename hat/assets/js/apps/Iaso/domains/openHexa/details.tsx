import React, { FunctionComponent, useState, useEffect } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { baseUrls } from 'Iaso/constants/urls';
import TopBar from '../../components/nav/TopBarComponent';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPipelineDetails } from './hooks/useGetPipelineDetails';

type PipelineDetailsParams = {
    pipelineId: string;
};

type ParameterValues = {
    [key: string]: any;
};

export const PipelineDetails: FunctionComponent = () => {
    const { pipelineId } = useParamsObject(
        baseUrls.pipelinedetails,
    ) as unknown as PipelineDetailsParams;
    const { data: pipeline, isFetching } = useGetPipelineDetails(pipelineId);

    // State to store parameter values
    const [parameterValues, setParameterValues] = useState<ParameterValues>({});

    // Initialize parameter values when pipeline data is loaded
    useEffect(() => {
        if (pipeline?.currentVersion?.parameters) {
            const initialValues: ParameterValues = {};
            pipeline.currentVersion.parameters.forEach(parameter => {
                // Set default values or empty values based on parameter type
                switch (parameter.type) {
                    case 'str':
                        initialValues[parameter.code] = parameter.default || '';
                        break;
                    case 'bool':
                        initialValues[parameter.code] =
                            parameter.default || false;
                        break;
                    case 'int':
                        initialValues[parameter.code] = parameter.default || 0;
                        break;
                    case 'float':
                        initialValues[parameter.code] =
                            parameter.default || 0.0;
                        break;
                    case 'list':
                        initialValues[parameter.code] = parameter.default || [];
                        break;
                    case 'dict':
                        initialValues[parameter.code] = parameter.default || {};
                        break;
                    default:
                        initialValues[parameter.code] =
                            parameter.default || null;
                }
            });
            setParameterValues(initialValues);
        }
    }, [pipeline]);

    // Handle parameter value changes
    const handleParameterChange = (parameterName: string, value: any) => {
        setParameterValues(prev => ({
            ...prev,
            [parameterName]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = () => {
        console.log('Submitting parameters:', parameterValues);
        // TODO: Implement API call to submit parameters
        // This is where you'll send the parameterValues to your API
    };

    const renderParameterInput = (parameter: any) => {
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
                        placeholder={`Enter ${parameter.name}`}
                        onChange={(key, value) =>
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
                        onChange={(key, value) =>
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
                        placeholder={`Enter ${parameter.name}`}
                        onChange={(key, value) =>
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
                        placeholder={`Enter ${parameter.name}`}
                        onChange={(key, value) =>
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
                        onChange={(key, value) =>
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
                        placeholder={`Enter JSON for ${parameter.name}`}
                        onChange={(key, value) => {
                            try {
                                // Try to parse JSON input
                                const parsedValue = value
                                    ? JSON.parse(value)
                                    : {};
                                handleParameterChange(
                                    parameter.code,
                                    parsedValue,
                                );
                            } catch (error) {
                                // If JSON is invalid, store as string for now
                                handleParameterChange(parameter.code, value);
                            }
                        }}
                    />
                );
            default:
                return (
                    <Typography
                        key={parameter.code}
                        variant="body2"
                        color="text.secondary"
                    >
                        Unknown parameter type: {parameter.type}
                    </Typography>
                );
        }
    };

    return (
        <>
            <TopBar title={pipeline?.name ?? ''} />
            {isFetching && <LoadingSpinner absolute />}
            {pipeline && (
                <Box
                    sx={{
                        padding: 2,
                        height: '100vh',
                        overflow: 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Paper
                        sx={{ padding: 3, width: '400px', maxWidth: '90vw' }}
                    >
                        <Typography
                            variant="h6"
                            sx={{ marginBottom: 3, textAlign: 'center' }}
                        >
                            Pipeline Parameters
                        </Typography>

                        {pipeline.currentVersion?.parameters.map(parameter => (
                            <Box key={parameter.name} sx={{ marginBottom: 2 }}>
                                {renderParameterInput(parameter)}
                            </Box>
                        ))}

                        <Box
                            sx={{
                                marginTop: 3,
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={isFetching}
                                sx={{ minWidth: '120px' }}
                            >
                                Submit Parameters
                            </Button>
                        </Box>

                        {/* Debug section - remove in production */}
                        <Box
                            sx={{
                                marginTop: 2,
                                padding: 1,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Current Values:
                            </Typography>
                            <pre
                                style={{
                                    fontSize: '10px',
                                    margin: 0,
                                    overflow: 'auto',
                                }}
                            >
                                {JSON.stringify(parameterValues, null, 2)}
                            </pre>
                        </Box>
                    </Paper>
                </Box>
            )}
        </>
    );
};
