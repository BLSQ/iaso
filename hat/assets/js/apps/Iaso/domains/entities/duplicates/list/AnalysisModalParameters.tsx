import { Grid, Typography } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';

type Props = {
    parameterComponents: string[];
    parameters: { name: string; value: string | number }[];
    onChangeParameters: () => void;
    handleParametersChange: (key: string, value: string, index: number) => void;
    getFilteredOptions: (
        index: number,
    ) => { label: string; value: string | number }[];
    paramDisabled: boolean[];
    removeParameter: (index: number) => void;
    areOptionsAvailable: boolean;
};
const AnalysisModalParameters: FunctionComponent<Props> = ({
    parameterComponents,
    parameters,
    onChangeParameters,
    handleParametersChange,
    getFilteredOptions,
    paramDisabled,
    removeParameter,
    areOptionsAvailable,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Grid
                item
                xs={6}
                md={8}
                display="flex"
                justifyContent="flex-start"
                marginTop={2}
            >
                <Typography>{formatMessage(MESSAGES.parameters)}:</Typography>
            </Grid>
            {parameterComponents.length === 0 && (
                <Grid
                    item
                    xs={6}
                    md={4}
                    display="flex"
                    justifyContent="flex-end"
                    marginTop={1}
                >
                    <IconButton
                        overrideIcon={AddCircleIcon}
                        onClick={onChangeParameters}
                        tooltipMessage={MESSAGES.addParameters}
                        iconSize="large"
                        color="primary"
                    />
                </Grid>
            )}

            {parameterComponents.map((parameter, index) => {
                const param = parameters[index] || {};
                return (
                    <Grid
                        container
                        item
                        spacing={3}
                        style={{ marginTop: '-24px' }}
                        key={parameter}
                    >
                        <Grid item xs={5} md={7} alignItems="center">
                            <InputComponent
                                type="select"
                                keyValue="parameters"
                                value={param.name}
                                onChange={(key, value) =>
                                    handleParametersChange(key, value, index)
                                }
                                label={MESSAGES.parameters}
                                options={getFilteredOptions(index)}
                            />
                        </Grid>
                        <Grid item xs={5} md={4} alignItems="center">
                            <InputComponent
                                type="text"
                                keyValue="parameter_value"
                                value={param.value}
                                onChange={(key, value) =>
                                    handleParametersChange(key, value, index)
                                }
                                label={MESSAGES.parameterValue}
                                disabled={paramDisabled[index]}
                            />
                        </Grid>
                        <Grid
                            item
                            xs={2}
                            md={1}
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                        >
                            <IconButton
                                overrideIcon={RemoveCircleIcon}
                                onClick={() => removeParameter(index)}
                                tooltipMessage={MESSAGES.removeParameter}
                            />
                        </Grid>
                    </Grid>
                );
            })}
            <Grid
                item
                xs={6}
                md={8}
                display="flex"
                justifyContent="flex-start"
                marginTop={2}
            />
            {parameterComponents.length > 0 && !areOptionsAvailable && (
                <Grid
                    item
                    xs={6}
                    md={4}
                    display="flex"
                    justifyContent="flex-end"
                    marginTop={1}
                >
                    <IconButton
                        overrideIcon={AddCircleIcon}
                        onClick={onChangeParameters}
                        tooltipMessage={MESSAGES.addParameters}
                        iconSize="large"
                        color="primary"
                    />
                </Grid>
            )}
        </>
    );
};

export default AnalysisModalParameters;
