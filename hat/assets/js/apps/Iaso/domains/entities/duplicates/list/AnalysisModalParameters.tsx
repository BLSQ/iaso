import { Grid, Typography } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useState,
    useMemo,
} from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import InputComponent, {
    InputComponentType,
} from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { LEVENSHTEIN_PARAMETERS_DROPDOWN } from '../../constants';
import { Parameters } from '../types';

type Props = {
    parameters: Parameters;
    setParameters: (parameters: any) => void;
    setConfirm: (val: boolean) => void;
    isConfirm: boolean | null;
};
const AnalysisModalParameters: FunctionComponent<Props> = ({
    parameters,
    setParameters,
    setConfirm,
    isConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    const [parameterComponents, setParameterComponents] = useState<string[]>(
        [],
    );
    const [paramDisabled, setParamDisabled] = useState<boolean[]>([]);
    const [paramValueType, setParamValueType] =
        useState<InputComponentType>('text');
    const parametersOptionsAvailable = useMemo(
        () =>
            JSON.stringify(
                LEVENSHTEIN_PARAMETERS_DROPDOWN.map(item => item.label),
            ) === JSON.stringify(parameters.map(item => item.name)),
        [parameters],
    );

    const handleParametersChange = useCallback(
        (keyValue: string, value: string, index: number) => {
            setParameters(prevParams => {
                const updatedParams = [...prevParams];

                if (keyValue === 'parameters') {
                    const selectedParameter =
                        LEVENSHTEIN_PARAMETERS_DROPDOWN.find(
                            option => option.value === value,
                        );
                    if (selectedParameter) {
                        updatedParams[index] = {
                            ...updatedParams[index],
                            name: selectedParameter.label,
                            value: updatedParams[index]?.value || '',
                        };
                        setParamDisabled(prev => {
                            const newStates = [...prev];
                            newStates[index] = false;
                            return newStates;
                        });
                        setParamValueType(
                            selectedParameter.value_type as InputComponentType,
                        );
                    } else {
                        updatedParams[index] = { name: '', value: '' };
                        setParamDisabled(prev => {
                            const newStates = [...prev];
                            newStates[index] = true;
                            return newStates;
                        });
                    }
                } else if (keyValue === 'parameter_value') {
                    updatedParams[index] = {
                        ...updatedParams[index],
                        value,
                    };
                }
                const allParamsFilled = updatedParams.every(
                    param => param.value !== '',
                );
                if (allParamsFilled && isConfirm) {
                    setConfirm(true);
                } else {
                    setConfirm(false);
                }

                return updatedParams;
            });
        },
        [isConfirm, setConfirm, setParamDisabled, setParameters],
    );

    const onChangeParameters = useCallback(() => {
        setParameterComponents(prevParams => [
            ...prevParams,
            `parameter_${prevParams.length}`,
        ]);

        setParameters(prevParams => [...prevParams, { name: '', value: '' }]);
        setParamDisabled(prev => [...prev, true]);
    }, [setParameters]);

    const removeParameter = useCallback(
        index => {
            setParameterComponents(prevParams =>
                prevParams.filter((_, i) => i !== index),
            );

            setParameters(prevParams =>
                prevParams.filter((_, i) => i !== index),
            );
            setParamDisabled(prev => prev.filter((_, i) => i !== index));
        },
        [setParameters],
    );

    const notSelectedOptions = useCallback(
        index => {
            const selectedValues = parameters.map(param => param.name);
            const remainParams = LEVENSHTEIN_PARAMETERS_DROPDOWN.filter(
                option =>
                    !selectedValues.includes(option.label) ||
                    parameters[index]?.name === option.label,
            );

            return remainParams;
        },
        [parameters],
    );

    const addParametersButton = useMemo(() => {
        return (
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
        );
    }, [onChangeParameters]);

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
            {parameterComponents.length === 0 && addParametersButton}

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
                                options={notSelectedOptions(index)}
                            />
                        </Grid>
                        <Grid item xs={5} md={4} alignItems="center">
                            <InputComponent
                                type={paramValueType}
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
            {parameterComponents.length > 0 &&
                !parametersOptionsAvailable &&
                addParametersButton}
        </>
    );
};

export default AnalysisModalParameters;
