import React, { Dispatch, FunctionComponent, SetStateAction } from 'react';
import BugReportIcon from '@mui/icons-material/BugReport';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Expander, useSafeIntl } from 'bluesquare-components';
import { baseUrls as coreBaseUrls } from 'Iaso/constants/urls';
import MESSAGES from '../messages';
import { Beneficiary } from '../types';

export type ActionsProps = {
    row: { original: Beneficiary };
    isExpanded: boolean;
    setIsExpanded: Dispatch<SetStateAction<boolean>>;
    accountId?: string;
    onShowData: (entityId: number) => void;
};

export const Actions: FunctionComponent<ActionsProps> = ({
    row,
    isExpanded,
    setIsExpanded,
    accountId,
    onShowData,
}) => {
    const { formatMessage } = useSafeIntl();
    const beneficiary = row.original;
    return (
        <Box display="flex" justifyContent="center" alignItems="center">
            <Tooltip title={formatMessage(MESSAGES.beneficiaryData)}>
                <IconButton
                    size="small"
                    aria-label={formatMessage(MESSAGES.beneficiaryData)}
                    onClick={() => onShowData(beneficiary.entity_id)}
                >
                    <PersonIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title={formatMessage(MESSAGES.debug)}>
                <IconButton
                    size="small"
                    aria-label={formatMessage(MESSAGES.debug)}
                    href={`/wfp/debug/${beneficiary.entity_id}/`}
                    target="_blank"
                >
                    <BugReportIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title={formatMessage(MESSAGES.seeEntity)}>
                <IconButton
                    size="small"
                    aria-label={formatMessage(MESSAGES.seeEntity)}
                    href={`/dashboard/${coreBaseUrls.entityDetails}/accountId/${accountId}/entityId/${beneficiary.entity_id}`}
                    target="_blank"
                >
                    <OpenInNewIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Expander isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        </Box>
    );
};
