import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import Alert from '@mui/lab/Alert';
import MESSAGES from '../messages';
import { AnalysisModalButton } from './AnalysisModalButton';
import InputComponent from '../../../../components/forms/InputComponent';
import { useGetBeneficiaryTypesDropdown } from '../../hooks/requests';
import { useStartAnalyse } from '../hooks/api/analyzes';
import { ALGORITHM_DROPDOWN } from '../../constants';
import { formatLabel } from '../../../instances/utils';
import { useGetFormForEntityType } from '../../entityTypes/hooks/requests/forms';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const AnalysisModal: FunctionComponent<Props> = ({ closeDialog, isOpen }) => {
    const [entityType, setEntityType] = useState(null);
    const [algorithm, setAlgorithm] = useState(null);
    const [defaultFields, setDefaultFields] = useState([]);
    const [entityTypeFields, setEntityTypeFields] = useState([]);
    const [referenceForm, setReferenceForm] = useState(undefined);
    const [confirm, setConfirm] = useState(false);
    const [errorMissingFields, setErrorMissingFields] = useState('');

    const { formatMessage } = useSafeIntl();

    const { data: entityTypesDropdown, isFetching: isFetchingEntityTypes } =
        useGetBeneficiaryTypesDropdown();

    const { mutateAsync: startAnalyse } = useStartAnalyse();
    const handleConfirm = useCallback(() => {
        startAnalyse({
            algorithm,
            entity_type_id: entityType,
            fields:
                entityTypeFields.length > 0 ? entityTypeFields : defaultFields,
            parameters: {},
        });
    }, [startAnalyse, algorithm, entityType, entityTypeFields, defaultFields]);

    const handleChangeEntityType = value => {
        const filteredEntityType = entityTypesDropdown?.find(
            entityTypeItem => entityTypeItem.value === value,
        );
        const entityTypeDefaultFields =
            filteredEntityType?.original?.fields_duplicate_search;
        setReferenceForm(filteredEntityType?.original?.reference_form);
        if (!entityTypeDefaultFields) {
            setErrorMissingFields(
                formatMessage(MESSAGES.messageErrorMissingFields),
            );
        } else {
            setErrorMissingFields('');
            setDefaultFields(entityTypeDefaultFields || []);
        }

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
        if (algorithm && entityType && errorMissingFields === '') {
            setConfirm(true);
        } else {
            setConfirm(false);
        }
    }, [algorithm, entityType, errorMissingFields]);
    const { possibleFields, isFetchingForm } = useGetFormForEntityType({
        formId: referenceForm,
        enabled: isOpen,
    });
    return (
        <ConfirmCancelModal
            allowConfirm={confirm}
            titleMessage={MESSAGES.launchAnalysis}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            id=""
            onClose={() => null}
            dataTestId=""
        >
            {errorMissingFields && (
                <Alert severity="error">{errorMissingFields}</Alert>
            )}

            <InputComponent
                type="select"
                keyValue="entity_type"
                value={entityType}
                onChange={handleChange}
                label={MESSAGES.entityTypes}
                options={entityTypesDropdown}
                loading={isFetchingEntityTypes}
            />
            <InputComponent
                type="select"
                keyValue="algorithm"
                value={algorithm}
                onChange={handleChange}
                label={MESSAGES.algorithm}
                options={ALGORITHM_DROPDOWN}
            />
            <InputComponent
                type="select"
                multi
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
        </ConfirmCancelModal>
    );
};

const analysisModal = makeFullModal(AnalysisModal, AnalysisModalButton);

export { analysisModal as AnalysisModal };
