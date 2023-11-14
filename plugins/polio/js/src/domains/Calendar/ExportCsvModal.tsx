import {
    ConfirmCancelModal,
    getTableUrl,
    makeFullModal,
} from 'bluesquare-components';
import React, { FunctionComponent, useState } from 'react';
import DatesRange from '../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import MESSAGES from '../../constants/messages.js';
import { ExportCsvModalButton } from './ExportCsvModalButton';

type Props = {
    currentDate: string;
    isOpen: boolean;
    closeDialog: () => void;
};

const ExportCsvModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    currentDate,
}) => {
    const [roundStartFrom, setRoundStartFrom] = useState(null);
    const [roundStartTo, setRoundStartTo] = useState(null);
    const onChangeDate = (keyValue, value) => {
        if (keyValue === 'roundStartFrom') {
            setRoundStartFrom(value);
        }
        if (keyValue === 'roundStartTo') {
            setRoundStartTo(value);
        }
    };

    const urlParams = {
        currentDate,
        roundStartFrom,
        roundStartTo,
    };
    const handleConfirm = () => {
        const xlsxUrl = getTableUrl(
            'polio/campaigns/create_all_rounds_scopes_csv',
            urlParams,
        );

        window.open(xlsxUrl, '_blank');
    };
    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={MESSAGES.dateRangeTitle}
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
            <DatesRange
                dateFromRequired
                keyDateFrom="roundStartFrom"
                keyDateTo="roundStartTo"
                labelFrom={MESSAGES.RoundStartFrom}
                labelTo={MESSAGES.RoundStartTo}
                dateFrom={roundStartFrom}
                dateTo={roundStartTo}
                onChangeDate={onChangeDate}
            />
        </ConfirmCancelModal>
    );
};

const exportCsv = makeFullModal(ExportCsvModal, ExportCsvModalButton);

export { exportCsv as ExportCsvModal };
