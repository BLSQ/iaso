import React, { FunctionComponent, useState } from 'react';
import {
    ConfirmCancelModal,
    getTableUrl,
    makeFullModal,
} from 'bluesquare-components';
import DatesRange from '../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import MESSAGES from '../../constants/messages';
import { CalendarParams } from './campaignCalendar/types';
import { ExportCsvModalButton } from './ExportCsvModalButton';

type Props = {
    params: CalendarParams;
    isOpen: boolean;
    closeDialog: () => void;
};

const ExportCsvModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    params,
}) => {
    const [roundStartFrom, setRoundStartFrom] = useState(undefined);
    const [roundStartTo, setRoundStartTo] = useState(undefined);
    const onChangeDate = (keyValue, value) => {
        if (keyValue === 'roundStartFrom') {
            setRoundStartFrom(value);
        }
        if (keyValue === 'roundStartTo') {
            setRoundStartTo(value);
        }
    };

    const urlParams = {
        currentDate: params.currentDate,
        countries: params.countries,
        campaignType: params.campaignType,
        campaignCategory: params.campaignCategory,
        campaignGroups: params.campaignGroups,
        orgUnitGroups: params.orgUnitGroups,
        search: params.search,
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
            dataTestId="launch-duplicate-analysis"
        >
            <DatesRange
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
