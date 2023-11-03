import {
    ConfirmCancelModal,
    getTableUrl,
    makeFullModal,
} from 'bluesquare-components';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { date } from 'yup';
import DatesRange from '../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import MESSAGES from '../../constants/messages.js';
import { ExportCsvModalButton } from './ExportCsvModalButton';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const ExportCsvModal: FunctionComponent<Props> = ({ closeDialog, isOpen }) => {
    const [roundStartFrom, setRoundStartFrom] = useState(null);
    const [roundStartTo, setRoundStartTo] = useState(null);
    const [confirm, setConfirm] = useState(false);
    const onChangeDate = (keyValue, value) => {
        if (keyValue === 'roundStartFrom') {
            setRoundStartFrom(value);
        }
        if (keyValue === 'roundStartTo') {
            setRoundStartTo(value);
        }
    };

    useEffect(() => {
        if (roundStartFrom !== null && roundStartTo !== null) {
            setConfirm(true);
        } else {
            setConfirm(false);
        }
    }, [roundStartFrom, roundStartTo]);
    const urlParams = {
        roundStartFrom,
        roundStartTo,
    };
    const handleConfirm = () => {
        const xlsxUrl = getTableUrl(
            'polio/campaigns/create_round_scopes_csv_sheet',
            urlParams,
        );
        console.log(xlsxUrl);
    };
    return (
        <ConfirmCancelModal
            allowConfirm={confirm}
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
