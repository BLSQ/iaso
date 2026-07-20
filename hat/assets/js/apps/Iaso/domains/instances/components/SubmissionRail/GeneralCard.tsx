import React, { FunctionComponent, ReactNode, useState } from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Box,
    Button,
    Chip,
    Collapse,
    Divider,
    Link,
    Paper,
    Typography,
} from '@mui/material';
import {
    LinkWithLocation,
    displayDateFromTimestamp,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import get from 'lodash/get';
import { baseUrls } from '../../../../constants/urls';
import {
    INSTANCE_METAS_FIELDS,
    INSTANCE_STATUS_ERROR,
    INSTANCE_STATUS_READY,
} from '../../constants';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import { ActivityRow, InfoRow } from './InfoRow';

type Props = {
    currentInstance: Instance;
    showHistoryLink: boolean;
};

const statusColor = (status: string): 'success' | 'error' | 'default' => {
    if (status === INSTANCE_STATUS_READY) return 'success';
    if (status === INSTANCE_STATUS_ERROR) return 'error';
    return 'default';
};

/**
 * Render one INSTANCE_METAS_FIELDS entry. The field descriptors carry the
 * renderers we want to keep (form and planning links, pretty periods, formatted
 * dates); only their layout is replaced here.
 */
const useFieldValue = (): ((key: string, instance: Instance) => ReactNode) => {
    return (key, instance) => {
        const field = INSTANCE_METAS_FIELDS.find(f => f.key === key);
        if (!field) return textPlaceholder;
        if (field.renderValue) return field.renderValue(instance);
        const value = get(instance, field.key);
        if (value === undefined || value === null || value === '') {
            return textPlaceholder;
        }
        return field.render ? field.render(value) : value;
    };
};

const countBadgeSx = {
    height: 20,
    fontSize: 11,
    fontWeight: 500,
    color: 'text.secondary',
    backgroundColor: 'grey.100',
    border: 'none',
    '& .MuiChip-label': { px: 0.9 },
} as const;

export const GeneralCard: FunctionComponent<Props> = ({
    currentInstance,
    showHistoryLink,
}) => {
    const { formatMessage } = useSafeIntl();
    const [showTechnical, setShowTechnical] = useState(false);
    const fieldValue = useFieldValue();

    const statusMessages = MESSAGES as Record<
        string,
        { id: string; defaultMessage: string } | undefined
    >;
    const statusLabel = currentInstance.status
        ? (statusMessages[currentInstance.status.toLowerCase()] ?? null)
        : null;

    // identifiers and provenance, folded away by default
    const technicalRows: ReactNode[] = [
        <ActivityRow
            key="created"
            dense
            label={formatMessage(MESSAGES.created_at)}
            who={fieldValue('created_by__username', currentInstance)}
            when={displayDateFromTimestamp(currentInstance.created_at)}
        />,
        <ActivityRow
            key="source_created_at"
            dense
            label={formatMessage(MESSAGES.source_created_at)}
            when={displayDateFromTimestamp(currentInstance.source_created_at)}
        />,
        <InfoRow key="uuid" dense mono label={formatMessage(MESSAGES.uuid)}>
            {currentInstance.uuid || textPlaceholder}
        </InfoRow>,
        <InfoRow
            key="version"
            dense
            mono
            label={formatMessage(MESSAGES.version)}
        >
            {fieldValue('version', currentInstance)}
        </InfoRow>,
        <InfoRow
            key="device_id"
            dense
            mono
            label={formatMessage(MESSAGES.device_id)}
        >
            {currentInstance.device_id || textPlaceholder}
        </InfoRow>,
        <InfoRow
            key="project_name"
            dense
            label={formatMessage(MESSAGES.project_name)}
        >
            {fieldValue('project_name', currentInstance)}
        </InfoRow>,
        <InfoRow key="planning" dense label={formatMessage(MESSAGES.planning)}>
            {fieldValue('planning', currentInstance)}
        </InfoRow>,
    ];

    return (
        <Paper elevation={0} variant="outlined" sx={{ mb: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    flexWrap: 'wrap',
                    px: 2.25,
                    pt: 1.75,
                    pb: 1,
                }}
            >
                <Typography variant="h6" color="primary">
                    {formatMessage(MESSAGES.general)}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                        gap: 0.75,
                    }}
                >
                    <Chip
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: 11.5 }}
                        label={formatMessage(
                            currentInstance.is_reference_instance
                                ? MESSAGES.referenceSubmission
                                : MESSAGES.notReferenceSubmission,
                        )}
                    />
                    {statusLabel && (
                        <Chip
                            size="small"
                            color={statusColor(currentInstance.status)}
                            sx={{ height: 22, fontSize: 11.5 }}
                            label={formatMessage(statusLabel)}
                        />
                    )}
                </Box>
            </Box>

            <Box sx={{ px: 2.25, pb: 1.5 }}>
                <InfoRow label={formatMessage(MESSAGES.form)}>
                    {fieldValue('form_name', currentInstance)}
                </InfoRow>
                <InfoRow label={formatMessage(MESSAGES.period)}>
                    {fieldValue('period', currentInstance)}
                </InfoRow>

                <Divider sx={{ my: 1.25 }} />
                <ActivityRow
                    label={formatMessage(
                        currentInstance.deleted
                            ? MESSAGES.deleted_at
                            : MESSAGES.updated_at,
                    )}
                    who={fieldValue('last_modified_by', currentInstance)}
                    when={displayDateFromTimestamp(currentInstance.updated_at)}
                />
                {showHistoryLink && (
                    <Box sx={{ pl: `${118 + 14}px`, pb: 0.5 }}>
                        <LinkWithLocation
                            to={`/${baseUrls.compareInstanceLogs}/instanceIds/${currentInstance.id}`}
                        >
                            {formatMessage(MESSAGES.seeAllVersions)}
                        </LinkWithLocation>
                    </Box>
                )}

                <Divider sx={{ mt: 1 }} />
                <Button
                    fullWidth
                    size="small"
                    color="inherit"
                    onClick={() => setShowTechnical(current => !current)}
                    startIcon={
                        <ExpandMoreIcon
                            sx={{
                                transition: 'transform .2s',
                                transform: showTechnical
                                    ? 'rotate(180deg)'
                                    : 'none',
                                color: 'text.disabled',
                            }}
                        />
                    }
                    sx={{
                        justifyContent: 'flex-start',
                        gap: 0.75,
                        color: 'text.secondary',
                        fontSize: 12.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        mt: 0.75,
                    }}
                >
                    {formatMessage(MESSAGES.technicalDetails)}
                    <Chip
                        size="small"
                        label={`${technicalRows.length}`}
                        sx={{ ...countBadgeSx, ml: 0.9 }}
                    />
                </Button>
                <Collapse in={showTechnical} unmountOnExit>
                    <Box sx={{ pt: 0.5 }}>
                        {technicalRows}
                        <Link
                            component="button"
                            underline="hover"
                            onClick={() =>
                                window.open(currentInstance.file_url, '_blank')
                            }
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.75,
                                mt: 1.25,
                                fontSize: 12.5,
                                fontWeight: 600,
                            }}
                        >
                            <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
                            {formatMessage(MESSAGES.downloadXml)}
                        </Link>
                    </Box>
                </Collapse>
            </Box>
        </Paper>
    );
};
