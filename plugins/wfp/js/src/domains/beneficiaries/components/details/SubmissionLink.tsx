import React, { FunctionComponent, useState } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import { Link, Tooltip } from '@mui/material';
import { SubmissionFields } from './SubmissionFields';
import { submissionUrl } from './utils';

// Link to a submission, showing all its fields when hovered (the card stays open while hovered, to scroll it)
export const SubmissionLink: FunctionComponent<{ instanceId: number }> = ({
    instanceId,
}) => {
    const [open, setOpen] = useState(false);
    return (
        <Tooltip
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            leaveDelay={250}
            placement="bottom-end"
            componentsProps={{
                tooltip: {
                    sx: {
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: 8,
                        p: 0,
                        pb: 1,
                        maxWidth: 560,
                        width: 'min(560px, calc(100vw - 32px))',
                        maxHeight: 480,
                        overflow: 'auto',
                    },
                },
            }}
            title={open ? <SubmissionFields instanceId={instanceId} /> : ''}
        >
            <Link
                href={submissionUrl(instanceId)}
                target="_blank"
                underline="hover"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 500,
                }}
            >
                <DescriptionIcon fontSize="small" />
                {instanceId}
            </Link>
        </Tooltip>
    );
};
