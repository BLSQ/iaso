import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { Grid } from '@mui/material';
import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import { noOp } from 'Iaso/utils';
import InputComponent from '../../../../components/forms/InputComponent';
import { formatLabel } from '../../../instances/utils';
import { ALGORITHM_DROPDOWN } from '../../constants';
import { useGetFormForEntityType } from '../../entityTypes/hooks/requests/forms';
import { useGetEntityTypesDropdown } from '../../hooks/requests';
import { useStartAnalyse } from '../hooks/api/analyzes';
import MESSAGES from '../messages';
import { Parameters } from '../types';
import { AnalysisModalButton } from './AnalysisModalButton';
import AnalysisModalParameters from './AnalysisModalParameters';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    onApply?: () => void;
};

const AnalysisModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    onApply = noOp,
}) => {
    const [entityType, setEntityType] = useState(null);
    const [algorithm, setAlgorithm] = useState(null);
    const [entityTypeFields, setEntityTypeFields] = useState([]);
    const [referenceForm, setReferenceForm] = useState(undefined);
    const [confirm, setConfirm] = useState(false);

    const [parameters, setParameters] = useState<Parameters>([]);

    const { data: entityTypesDropdown, isFetching: isFetchingEntityTypes } =
        useGetEntityTypesDropdown();

    const { mutateAsync: startAnalyse } = useStartAnalyse();
    const handleConfirm = useCallback(() => {
        startAnalyse({
            algorithm,
            entity_type_id: entityType,
            fields: entityTypeFields,
            parameters,
        }).then(() => onApply());
    }, [
        startAnalyse,
        onApply,
        algorithm,
        entityType,
        entityTypeFields,
        parameters,
    ]);

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

    const isConfirm = algorithm && entityType && entityTypeFields.length > 0;
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
                    parameters={parameters}
                    setParameters={setParameters}
                    setConfirm={setConfirm}
                    isConfirm={isConfirm}
                />
            </Grid>
        </ConfirmCancelModal>
    );
};

const analysisModal = makeFullModal(AnalysisModal, AnalysisModalButton);

export { analysisModal as AnalysisModal };
