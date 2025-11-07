import React, { FC } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { IconButton } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import MESSAGES from '../duplicates/messages';

type Props = {
    analysisId: number;
    status: string;
    onRelaunch: () => void;
};

export const ActionCell: FC<Props> = ({ analysisId, status, onRelaunch }) => {
    return (
        <>
            <IconButton
                onClick={onRelaunch}
                overrideIcon={HistoryIcon}
                tooltipMessage={MESSAGES.relaunchAnalysis}
                disabled={status === 'RUNNING'}
            />
            <IconButton
                url={`/${baseUrls.stockRulesVersions}/versionId/${analysisId}`}
                overrideIcon={RemoveRedEyeIcon}
                tooltipMessage={MESSAGES.viewAnalysis}
            />
        </>
    );
};
