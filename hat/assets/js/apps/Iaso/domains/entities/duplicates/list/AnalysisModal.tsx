import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import MESSAGES from '../messages';
import { AnalysisModalButton } from './AnalysisModalButton';
import InputComponent from '../../../../components/forms/InputComponent';
import { useGetBeneficiaryTypesDropdown } from '../../hooks/requests';
import { useStartAnalyse } from '../hooks/api/analyzes';
import { ALGORITHM_DROPDOWN } from '../../constants';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const AnalysisModal: FunctionComponent<Props> = ({ closeDialog, isOpen }) => {
    const [entityType, setEntityType] = useState(null);
    const [algorithm, setAlgorithm] = useState(null);
    const [fields, setFields] = useState([]);
    const [confirm, setConfirm] = useState(false);

    const { data: entityTypesDropdown, isFetching: isFetchingEntityTypes } =
        useGetBeneficiaryTypesDropdown();

    const { mutateAsync: startAnalyse } = useStartAnalyse();
    const handleConfirm = useCallback(() => {
        startAnalyse({
            algorithm,
            entity_type_id: entityType,
            fields,
            parameters: {},
        });
    }, [startAnalyse, algorithm, entityType, fields]);

    const handleChange = (keyValue, value) => {
        if (keyValue === 'entity_type') {
            const filteredEntityType = entityTypesDropdown?.find(
                entityTypeItem => entityTypeItem.value === value,
            );
            const entityTypeFields =
                filteredEntityType?.original?.fields_duplicate_search;

            setFields(entityTypeFields || []);
            setEntityType(value);
        }
        if (keyValue === 'algorithm') {
            setAlgorithm(value);
        }
    };

    useEffect(() => {
        if (algorithm && entityType) {
            setConfirm(true);
        } else {
            setConfirm(false);
        }
    }, [algorithm, entityType]);

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
        </ConfirmCancelModal>
    );
};

const analysisModal = makeFullModal(AnalysisModal, AnalysisModalButton);

export { analysisModal as AnalysisModal };
