import React, { FunctionComponent, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Tooltip,
    Typography,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { useSafeIntl } from 'bluesquare-components';
import { useQuery } from 'react-query';
import MESSAGES from './../messages';

// HTML fragments rendered (and escaped) by the Django views of the plugin, also used by the HTML screen
const beneficiaryDataUrl = (entityId: number) =>
    `/wfp/beneficiaries/${entityId}/data/`;
const submissionFieldsUrl = (instanceId: number) =>
    `/wfp/submissions/${instanceId}/fields/`;

const useHtmlFragment = (url: string, enabled = true) =>
    useQuery(
        ['wfpHtmlFragment', url],
        async () => {
            const response = await fetch(url, { credentials: 'same-origin' });
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            return response.text();
        },
        { enabled, staleTime: Infinity, retry: false },
    );

// Key / value tables, titles and collapsible submissions of the fragments
const fragmentSx: SxProps<Theme> = theme => ({
    fontSize: 13,
    '& h3': {
        fontSize: 16,
        fontWeight: 500,
        color: theme.palette.primary.main,
        m: '20px 0 8px',
    },
    '& table': { width: '100%', borderCollapse: 'collapse' },
    '& th, & td': {
        textAlign: 'left',
        verticalAlign: 'top',
        p: '6px 16px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        wordBreak: 'break-word',
    },
    '& th': {
        width: '40%',
        fontWeight: 400,
        color: theme.palette.text.secondary,
    },
    '& details': {
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mb: 1,
    },
    '& details[open]': { boxShadow: theme.shadows[1] },
    '& summary': {
        cursor: 'pointer',
        p: '10px 16px',
        '&:hover': { background: 'rgba(0, 0, 0, 0.04)' },
    },
    '& details p': { m: 0, p: '0 16px 8px', color: 'text.secondary' },
    '& .muted': { color: 'text.secondary' },
    '& .submission-header': {
        position: 'sticky',
        top: 0,
        background: theme.palette.primary.main,
        color: '#fff',
        p: '10px 16px',
        mb: 0.5,
        lineHeight: 1.5,
    },
});

const Fragment: FunctionComponent<{ url: string; errorMessage: string }> = ({
    url,
    errorMessage,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, error, isLoading } = useHtmlFragment(url);
    if (isLoading) {
        return (
            <Typography sx={{ p: 3 }} color="textSecondary">
                {formatMessage(MESSAGES.loading)}
            </Typography>
        );
    }
    if (error) {
        return (
            <Typography sx={{ p: 3 }} color="error">
                {`${errorMessage}: ${(error as Error).message}`}
            </Typography>
        );
    }

    return (
        <Box sx={fragmentSx} dangerouslySetInnerHTML={{ __html: data ?? '' }} />
    );
};

type DialogProps = {
    entityId: number | undefined;
    onClose: () => void;
};

// All the data of a beneficiary: entity, reference form and every submission linked to it
export const BeneficiaryDataDialog: FunctionComponent<DialogProps> = ({
    entityId,
    onClose,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Dialog
            open={entityId !== undefined}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    py: 1.5,
                }}
            >
                {formatMessage(MESSAGES.beneficiaryData)}
                <IconButton
                    onClick={onClose}
                    sx={{ color: '#fff' }}
                    aria-label={formatMessage(MESSAGES.close)}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
                {entityId !== undefined && (
                    <Fragment
                        url={beneficiaryDataUrl(entityId)}
                        errorMessage={formatMessage(MESSAGES.couldNotLoadData)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

// Link to a submission, showing all its fields when hovered (the card stays open while hovered, to scroll it)
export const SubmissionLink: FunctionComponent<{ instanceId: number }> = ({
    instanceId,
}) => {
    const { formatMessage } = useSafeIntl();
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
            title={
                open ? (
                    <Fragment
                        url={submissionFieldsUrl(instanceId)}
                        errorMessage={formatMessage(
                            MESSAGES.couldNotLoadSubmission,
                        )}
                    />
                ) : (
                    ''
                )
            }
        >
            <Link
                href={`/dashboard/forms/submission/instanceId/${instanceId}`}
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
