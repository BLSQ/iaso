import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { Avatar } from '@mui/material';
import { Timeline } from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';

type AvatarTimelineProps = {
    type: Timeline['type'];
    status: Timeline['status'];
};

export const AvatarTimeline = ({ status, type }: AvatarTimelineProps) => {
    if (type === 'NEXT_BYPASS') {
        return (
            <Avatar sx={{ bgcolor: 'background.warning' }}>
                <MoreHorizIcon />
            </Avatar>
        );
    } else {
        switch (status) {
            case 'REJECTED':
                return (
                    <Avatar sx={{ bgcolor: 'background.error' }}>
                        <ClearIcon />
                    </Avatar>
                );
            case 'ACCEPTED':
                return (
                    <Avatar sx={{ bgcolor: 'background.success' }}>
                        <CheckIcon />
                    </Avatar>
                );
            case 'SKIPPED':
                return (
                    <Avatar>
                        <SkipNextIcon />
                    </Avatar>
                );
            case 'UNKNOWN':
                return (
                    <Avatar sx={{ bgcolor: 'background.warning' }}>
                        <MoreHorizIcon />
                    </Avatar>
                );
        }
    }
};
