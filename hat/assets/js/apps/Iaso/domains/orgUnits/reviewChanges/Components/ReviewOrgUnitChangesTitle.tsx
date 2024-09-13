import InfoIcon from '@mui/icons-material/Info';
import { Box, IconButton, Popover } from '@mui/material';
import React, { FunctionComponent, useState } from 'react';
import { OrgUnitChangeRequestDetails } from '../types';
import {
    ReviewOrgUnitChangesInfos,
    colorCodes,
} from './ReviewOrgUnitChangesInfos';

type Props = {
    titleMessage: string;
    changeRequest?: OrgUnitChangeRequestDetails;
    isFetchingChangeRequest: boolean;
};

export const ReviewOrgUnitChangesTitle: FunctionComponent<Props> = ({
    titleMessage,
    changeRequest,
    isFetchingChangeRequest,
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'org-unit-change-request-popover' : undefined;
    const statusColor =
        changeRequest && colorCodes[changeRequest.status]
            ? `${colorCodes[changeRequest.status]}.main`
            : 'inherit';

    return (
        <Box
            sx={{
                color: statusColor,
            }}
        >
            {titleMessage}
            <Box
                sx={{
                    display: 'inline-block',
                    top: '-2px',
                    position: 'relative',
                }}
            >
                <IconButton
                    onClick={handleClick}
                    aria-describedby={id}
                    sx={{
                        color: statusColor,
                    }}
                >
                    <InfoIcon />
                </IconButton>
                <Popover
                    id={id}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                >
                    <ReviewOrgUnitChangesInfos
                        changeRequest={changeRequest}
                        isFetchingChangeRequest={isFetchingChangeRequest}
                    />
                </Popover>
            </Box>
        </Box>
    );
};
