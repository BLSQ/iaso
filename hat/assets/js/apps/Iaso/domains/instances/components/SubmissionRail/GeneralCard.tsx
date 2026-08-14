import React, { FunctionComponent, ReactNode, useState } from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
    Box,
    Button,
    Chip,
    Collapse,
    Divider,
    Link,
    Paper,
    Tooltip,
} from '@mui/material';
import {
    LinkWithLocation,
    textPlaceholder,
    useSafeIntl,
    IntlMessage,
} from 'bluesquare-components';
import get from 'lodash/get';
import { SxStyles } from 'Iaso/types/general';
import { baseUrls } from '../../../../constants/urls';
import { ProjectChip } from '../../../projects/components/ProjectChip';
import {
    INSTANCE_METAS_FIELDS,
    INSTANCE_STATUS_ERROR,
    INSTANCE_STATUS_EXPORTED,
    INSTANCE_STATUS_READY,
} from '../../constants';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import { formatTimestamp } from '../../utils/formatDate';
import { ActivityRow, InfoRow, LABEL_WIDTH } from './InfoRow';

type Props = {
    currentInstance: Instance;
    showHistoryLink: boolean;
};

const statusColor = (status: string): 'success' | 'error' | 'default' => {
    if (status === INSTANCE_STATUS_READY) return 'success';
    if (status === INSTANCE_STATUS_ERROR) return 'error';
    return 'default';
};

/** Status value -> its label message, keyed on the INSTANCE_STATUS_* constants. */
const STATUS_LABELS: Record<string, IntlMessage> = {
    [INSTANCE_STATUS_READY]: MESSAGES.ready,
    [INSTANCE_STATUS_ERROR]: MESSAGES.error,
    [INSTANCE_STATUS_EXPORTED]: MESSAGES.exported,
};

/**
 * Render one INSTANCE_METAS_FIELDS entry. The field descriptors carry the
 * renderers we want to keep (form and planning links, pretty periods, formatted
 * dates); only their layout is replaced here.
 */
const getFieldValue = (key: string, instance: Instance): ReactNode => {
    const field = INSTANCE_METAS_FIELDS.find(f => f.key === key);
    if (!field) return textPlaceholder;
    if (field.renderValue) return field.renderValue(instance);
    const value = get(instance, field.key);
    if (value === undefined || value === null || value === '') {
        return textPlaceholder;
    }
    return field.render ? field.render(value) : value;
};

const styles: SxStyles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        flexWrap: 'wrap',
        px: 2.25,
        pt: 1.75,
        pb: 1,
    },
    countBadge: {
        height: 20,
        fontSize: 12,
        fontWeight: 500,
        color: 'text.secondary',
        backgroundColor: 'grey.100',
        border: 'none',
        '& .MuiChip-label': { px: 0.9 },
    },
    referenceSubmissionChip: {
        height: 22,
        fontSize: 12,
        fontWeight: 500,
        color: 'text.secondary',
        backgroundColor: 'grey.100',
        border: 1,
        borderColor: 'divider',
        '& .MuiChip-label': { px: 1.25 },
    },
    statusBadgeContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: 0.75,
    },
    downloadXmlLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        mt: 1.25,
        fontSize: 12,
        fontWeight: 600,
    },
    technicalDetailsButton: {
        justifyContent: 'flex-start',
        gap: 0.75,
        color: 'text.secondary',
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'none',
        mt: 0.75,
    },
};

export const GeneralCard: FunctionComponent<Props> = ({
    currentInstance,
    showHistoryLink,
}) => {
    const { formatMessage } = useSafeIntl();
    const [showTechnical, setShowTechnical] = useState(false);
    const fieldValue = (key: string): ReactNode =>
        getFieldValue(key, currentInstance);

    const statusLabel = currentInstance.status
        ? (STATUS_LABELS[currentInstance.status] ?? null)
        : null;
    // identifiers and provenance, folded away by default
    const technicalRows: ReactNode[] = [
        <ActivityRow
            key="created"
            label={formatMessage(MESSAGES.created_at)}
            who={fieldValue('created_by__username')}
            when={formatTimestamp(currentInstance.created_at)}
        />,
        <ActivityRow
            key="source_created_at"
            label={formatMessage(MESSAGES.source_created_at)}
            when={formatTimestamp(currentInstance.source_created_at)}
        />,
        <InfoRow key="uuid" mono label={formatMessage(MESSAGES.uuid)}>
            {currentInstance.uuid || textPlaceholder}
        </InfoRow>,
        <InfoRow key="version" mono label={formatMessage(MESSAGES.version)}>
            {fieldValue('version')}
        </InfoRow>,
        <InfoRow key="device_id" mono label={formatMessage(MESSAGES.device_id)}>
            {currentInstance.device_id || textPlaceholder}
        </InfoRow>,
        <InfoRow
            key="project_name"
            label={formatMessage(MESSAGES.project_name)}
        >
            <ProjectChip project={currentInstance.project} />
        </InfoRow>,
        <InfoRow key="planning" label={formatMessage(MESSAGES.planning)}>
            {fieldValue('planning')}
        </InfoRow>,
    ];

    return (
        <Paper elevation={0} variant="outlined" sx={{ mb: 2 }}>
            <Box sx={styles.root}>
                <Tooltip title={formatMessage(MESSAGES.general)}>
                    <InfoOutlinedIcon color="primary" />
                </Tooltip>
                <Box sx={styles.statusBadgeContainer}>
                    <Chip
                        size="small"
                        sx={styles.referenceSubmissionChip}
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
                            sx={{ height: 22, fontSize: 12 }}
                            label={formatMessage(statusLabel)}
                        />
                    )}
                </Box>
            </Box>

            <Box sx={{ px: 2.25, pb: 1.5 }}>
                <InfoRow label={formatMessage(MESSAGES.form)}>
                    {fieldValue('form_name')}
                </InfoRow>
                <InfoRow label={formatMessage(MESSAGES.period)}>
                    {fieldValue('period')}
                </InfoRow>

                <Divider sx={{ my: 1.25 }} />
                <ActivityRow
                    label={formatMessage(
                        currentInstance.deleted
                            ? MESSAGES.deleted_at
                            : MESSAGES.updated_at,
                    )}
                    who={fieldValue('last_modified_by')}
                    when={formatTimestamp(currentInstance.updated_at)}
                />
                {showHistoryLink && (
                    <Box sx={{ pl: `${LABEL_WIDTH + 14}px`, pb: 0.5 }}>
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
                    sx={styles.technicalDetailsButton}
                >
                    {formatMessage(MESSAGES.technicalDetails)}
                    <Chip
                        size="small"
                        label={`${technicalRows.length}`}
                        sx={{ ...styles.countBadge, ml: 0.9 }}
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
                            sx={styles.downloadXmlLink}
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
