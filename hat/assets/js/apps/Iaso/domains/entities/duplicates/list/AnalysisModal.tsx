import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import MESSAGES from '../messages';
import { AnalysisModalButton } from './AnalysisModalButton';
import InputComponent from '../../../../components/forms/InputComponent';
import { useGetBeneficiaryTypesDropdown } from '../../hooks/requests';
import { useStartAnalyse } from '../hooks/api/analyzes';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

// TODO move to more accessible const
const algorithmDropDown = [
    { label: 'namesim', value: 'namesim' },
    { label: 'levenshtein', value: 'levenshtein' },
    { label: 'invert', value: 'invert' },
];

const AnalysisModal: FunctionComponent<Props> = ({ closeDialog, isOpen }) => {
    const [entityType, setEntityType] = useState();
    const [algorithm, setAlgorithm] = useState();
    const [fields, setFields] = useState([]);
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
    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={MESSAGES.relaunchAnalysis}
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
                options={algorithmDropDown}
            />
        </ConfirmCancelModal>
    );
};

const analysisModal = makeFullModal(AnalysisModal, AnalysisModalButton);

export { analysisModal as AnalysisModal };
