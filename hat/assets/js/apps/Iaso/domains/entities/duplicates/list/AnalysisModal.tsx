import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import MESSAGES from '../messages';
import { AnalysisModalButton } from './AnalysisModalButton';
import InputComponent from '../../../../components/forms/InputComponent';
import { useGetBeneficiaryTypesDropdown } from '../../hooks/requests';
// import { Analysis } from '../types';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    handleChange: () => void;
    handleConfirm: () => void;
};

// TODO move to more accessible const
const algorithmDropDown = [
    { label: 'namesim', value: 'namesim' },
    { label: 'levenshtein', value: 'levenshtein' },
    { label: 'invert', value: 'invert' },
];

const AnalysisModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    handleChange,
    handleConfirm,
}) => {
    // const handleConfirm = () => {
    //     console.log('hello bro');
    // };

    const { data: entityTypesDropdown, isFetching: isFetchingEntityTypes } =
        useGetBeneficiaryTypesDropdown();
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
                multi
                keyValue="entity_type"
                onChange={handleChange}
                label={MESSAGES.entityTypes}
                options={entityTypesDropdown}
                loading={isFetchingEntityTypes}
            />
            <InputComponent
                type="select"
                keyValue="algorithm"
                onChange={handleChange}
                label={MESSAGES.algorithm}
                options={algorithmDropDown}
            />
        </ConfirmCancelModal>
    );
};

const analysisModal = makeFullModal(AnalysisModal, AnalysisModalButton);

export { analysisModal as AnalysisModal };
