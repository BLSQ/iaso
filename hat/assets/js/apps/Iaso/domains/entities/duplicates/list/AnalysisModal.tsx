import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Grid } from '@mui/material';
import MESSAGES from '../messages';
import { AnalysisModalButton } from './AnalysisModalButton';
import InputComponent from '../../../../components/forms/InputComponent';
import { useGetBeneficiaryTypesDropdown } from '../../hooks/requests';
import { useStartAnalyse } from '../hooks/api/analyzes';
import {
    ALGORITHM_DROPDOWN,
    LEVENSHTEIN_PARAMETERS_DROPDOWN,
} from '../../constants';
import { formatLabel } from '../../../instances/utils';
import { useGetFormForEntityType } from '../../entityTypes/hooks/requests/forms';
import AnalysisModalParameters from './AnalysisModalParameters';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const AnalysisModal: FunctionComponent<Props> = ({ closeDialog, isOpen }) => {
    const [entityType, setEntityType] = useState(null);
    const [algorithm, setAlgorithm] = useState(null);
    const [entityTypeFields, setEntityTypeFields] = useState([]);
    const [referenceForm, setReferenceForm] = useState(undefined);
    const [confirm, setConfirm] = useState(false);
    const [parameterComponents, setParameterComponents] = useState<string[]>(
        [],
    );
    const [parameters, setParameters] = useState<
        { name: string; value: string | number }[]
    >([]);
    const [paramDisabled, setParamDisabled] = useState<boolean[]>([]);
    const { data: entityTypesDropdown, isFetching: isFetchingEntityTypes } =
        useGetBeneficiaryTypesDropdown();

    const { mutateAsync: startAnalyse } = useStartAnalyse();
    const handleConfirm = useCallback(() => {
        startAnalyse({
            algorithm,
            entity_type_id: entityType,
            fields: entityTypeFields,
            parameters,
        });
    }, [startAnalyse, algorithm, entityType, entityTypeFields, parameters]);

    const handleChangeEntityType = value => {
        const filteredEntityType = entityTypesDropdown?.find(
            entityTypeItem => entityTypeItem.value === value,
        );

        setReferenceForm(filteredEntityType?.original?.reference_form);

        setEntityType(value);
    };

    const handleChange = (keyValue, value) => {
        switch (keyValue) {
            case 'entity_type':
                handleChangeEntityType(value);
                break;

            case 'entity_type_fields':
                setEntityTypeFields(value || []);
                break;

            case 'algorithm':
                setAlgorithm(value);
                break;

            default:
                break;
        }
    };

    const handleParametersChange = (keyValue, value, index) => {
        setParameters(prevParams => {
            const updatedParams = [...prevParams];

            if (keyValue === 'parameters') {
                const selectedParameter = LEVENSHTEIN_PARAMETERS_DROPDOWN.find(
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
            if (
                allParamsFilled &&
                algorithm &&
                entityType &&
                entityTypeFields.length > 0
            ) {
                setConfirm(true);
            } else {
                setConfirm(false);
            }

            return updatedParams;
        });
    };

    useEffect(() => {
        const allParamsFilled = parameters.every(param => param.value !== '');
        if (
            allParamsFilled &&
            algorithm &&
            entityType &&
            entityTypeFields.length > 0
        ) {
            setConfirm(true);
        } else {
            setConfirm(false);
        }
    }, [algorithm, entityType, entityTypeFields, parameters]);
    const { possibleFields, isFetchingForm } = useGetFormForEntityType({
        formId: referenceForm,
        enabled: isOpen,
    });

    const onChangeParameters = () => {
        setParameterComponents(prevParams => [
            ...prevParams,
            `parameter_${prevParams.length}`,
        ]);

        setParameters(prevParams => [...prevParams, { name: '', value: '' }]);
        setParamDisabled(prev => [...prev, true]);
    };

    const removeParameter = index => {
        setParameterComponents(prevParams =>
            prevParams.filter((_, i) => i !== index),
        );

        setParameters(prevParams => prevParams.filter((_, i) => i !== index));
        setParamDisabled(prev => prev.filter((_, i) => i !== index));
    };

    const getFilteredOptions = useCallback(
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
    const areOptionsAvailable = useMemo(
        () =>
            JSON.stringify(
                LEVENSHTEIN_PARAMETERS_DROPDOWN.map(item => item.label),
            ) === JSON.stringify(parameters.map(item => item.name)),
        [parameters],
    );

    return (
        <ConfirmCancelModal
            allowConfirm={confirm}
            titleMessage={MESSAGES.launchAnalysis}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="sm"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            id=""
            onClose={() => null}
            dataTestId=""
        >
            <Grid container>
                <Grid item xs={12} md={12}>
                    <InputComponent
                        type="select"
                        keyValue="entity_type"
                        value={entityType}
                        onChange={handleChange}
                        label={MESSAGES.entityTypes}
                        options={entityTypesDropdown}
                        loading={isFetchingEntityTypes}
                    />
                </Grid>
                <Grid item xs={12} md={12}>
                    <InputComponent
                        type="select"
                        keyValue="algorithm"
                        value={algorithm}
                        onChange={handleChange}
                        label={MESSAGES.algorithm}
                        options={ALGORITHM_DROPDOWN}
                    />
                </Grid>
                <Grid item xs={12} md={12}>
                    <InputComponent
                        type="select"
                        multi
                        required
                        disabled={isFetchingForm || !referenceForm}
                        keyValue="entity_type_fields"
                        onChange={(key, value) =>
                            handleChange(key, value ? value.split(',') : null)
                        }
                        value={entityTypeFields}
                        label={MESSAGES.fields}
                        options={possibleFields.map(field => ({
                            value: field.name,
                            label: formatLabel(field),
                        }))}
                    />
                </Grid>
                <AnalysisModalParameters
                    parameterComponents={parameterComponents}
                    parameters={parameters}
                    onChangeParameters={onChangeParameters}
                    handleParametersChange={handleParametersChange}
                    getFilteredOptions={getFilteredOptions}
                    paramDisabled={paramDisabled}
                    removeParameter={removeParameter}
                    areOptionsAvailable={areOptionsAvailable}
                />
            </Grid>
        </ConfirmCancelModal>
    );
};

const analysisModal = makeFullModal(AnalysisModal, AnalysisModalButton);

export { analysisModal as AnalysisModal };
