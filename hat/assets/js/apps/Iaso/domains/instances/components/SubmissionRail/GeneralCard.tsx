import React, { FunctionComponent, useMemo, useState } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
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
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import {
    INSTANCE_METAS_FIELDS,
    INSTANCE_STATUS_ERROR,
    INSTANCE_STATUS_READY,
} from '../../constants';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import InstanceDetailsInfos from '../InstanceDetailsInfos';

/**
 * Fields that stay visible, versus the identifiers and provenance data folded
 * away behind the "technical details" disclosure. Keys refer to
 * INSTANCE_METAS_FIELDS so the existing renderers (links, pretty periods,
 * formatted dates) are reused as is.
 */
const PRIMARY_KEYS = ['form_name', 'period'];
const ACTIVITY_KEYS = ['last_modified_by', 'updated_at'];
const TECHNICAL_KEYS = [
    'created_by__username',
    'created_at',
    'source_created_at',
    'uuid',
    'version',
    'device_id',
    'project_name',
    'planning',
];

const fieldsFor = (keys: string[]) =>
    keys
        .map(key => INSTANCE_METAS_FIELDS.find(field => field.key === key))
        .filter(Boolean);

type Props = {
    currentInstance: Instance;
    showHistoryLink: boolean;
};

const statusColor = (
    status: string,
): 'success' | 'error' | 'default' | 'warning' => {
    if (status === INSTANCE_STATUS_READY) return 'success';
    if (status === INSTANCE_STATUS_ERROR) return 'error';
    return 'default';
};

export const GeneralCard: FunctionComponent<Props> = ({
    currentInstance,
    showHistoryLink,
}) => {
    const { formatMessage } = useSafeIntl();
    const [showTechnical, setShowTechnical] = useState(false);

    const primaryFields = useMemo(() => fieldsFor(PRIMARY_KEYS), []);
    const activityFields = useMemo(() => fieldsFor(ACTIVITY_KEYS), []);
    const technicalFields = useMemo(() => fieldsFor(TECHNICAL_KEYS), []);

    const statusMessages = MESSAGES as Record<
        string,
        { id: string; defaultMessage: string } | undefined
    >;
    const statusLabel = currentInstance.status
        ? (statusMessages[currentInstance.status.toLowerCase()] ?? null)
        : null;

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
                    pb: 1.25,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Typography variant="h6" color="primary">
                        {formatMessage(MESSAGES.general)}
                    </Typography>
                    <Chip
                        size="small"
                        variant="outlined"
                        label={formatMessage(
                            currentInstance.is_reference_instance
                                ? MESSAGES.referenceSubmission
                                : MESSAGES.notReferenceSubmission,
                        )}
                    />
                </Box>
                {statusLabel && (
                    <Chip
                        size="small"
                        color={statusColor(currentInstance.status)}
                        label={formatMessage(statusLabel)}
                    />
                )}
            </Box>

            <Box sx={{ px: 2.25, pb: 1.75 }}>
                <InstanceDetailsInfos
                    instance_metas_fields={primaryFields}
                    currentInstance={currentInstance}
                />

                <Divider sx={{ my: 1.25 }} />
                <InstanceDetailsInfos
                    instance_metas_fields={activityFields}
                    currentInstance={currentInstance}
                />
                {showHistoryLink && (
                    <Box sx={{ mt: 0.5, textAlign: 'right' }}>
                        <LinkWithLocation
                            to={`/${baseUrls.compareInstanceLogs}/instanceIds/${currentInstance.id}`}
                        >
                            {formatMessage(MESSAGES.seeAllVersions)}
                        </LinkWithLocation>
                    </Box>
                )}

                <Divider sx={{ mt: 1.25 }} />
                <Button
                    fullWidth
                    size="small"
                    color="inherit"
                    onClick={() => setShowTechnical(current => !current)}
                    endIcon={
                        <ExpandMoreIcon
                            sx={{
                                transition: 'transform .2s',
                                transform: showTechnical
                                    ? 'rotate(180deg)'
                                    : 'none',
                            }}
                        />
                    }
                    sx={{
                        justifyContent: 'space-between',
                        color: 'text.secondary',
                        textTransform: 'none',
                        mt: 0.5,
                    }}
                >
                    {formatMessage(MESSAGES.technicalDetails)}
                </Button>
                <Collapse in={showTechnical} unmountOnExit>
                    <Box sx={{ pt: 0.5 }}>
                        <InstanceDetailsInfos
                            instance_metas_fields={technicalFields}
                            currentInstance={currentInstance}
                        />
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
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            <DescriptionIcon sx={{ fontSize: 16 }} />
                            {formatMessage(MESSAGES.downloadXml)}
                        </Link>
                    </Box>
                </Collapse>
            </Box>
        </Paper>
    );
};
