import React, { useMemo } from 'react';

import { ArrowForward } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import Alert from '@mui/material/Alert';

import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { SxStyles } from '../../../types/general';
import MESSAGES from '../messages';
import { QuestionStatus } from '../types';
import { LabeledValue } from './QuestionPanel/LabeledValue';
import { MappingCard } from './QuestionPanel/MappingCard';

const styles: SxStyles = {
    hint: {
        mb: 2,
    },
    fields: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 2,
    },
    stats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 2,
        mt: 2,
        pt: 2,
        borderTop: 1,
        borderColor: 'divider',
    },
    section: {
        mt: 2,
        pt: 2,
        borderTop: 1,
        borderColor: 'divider',
    },
    eventDateSource: {
        maxWidth: 400,
    },
    actions: {
        display: 'flex',
        gap: 1,
        mt: 2,
    },
};

const evenDateOptions = [
    {
        value: 'FROM_SUBMISSION_CREATED_AT',
        label: MESSAGES.fromSubmissionCreatedAt,
    },
    {
        value: 'FROM_SUBMISSION_PERIOD',
        label: MESSAGES.fromSubmissionPeriod,
    },
];

function toGeneralFields(currentMappingVersion) {
    const fields = [];

    if (currentMappingVersion.mapping.mapping_type) {
        fields.push({
            name: 'mappingType',
            value: currentMappingVersion.mapping.mapping_type,
            message: MESSAGES.mappingType,
        });
    }

    if (currentMappingVersion.derivate_settings.program_name) {
        fields.push({
            name: 'programName',
            value: currentMappingVersion.derivate_settings.program_name,
            message: MESSAGES.program,
        });
    }
    if (currentMappingVersion.derivate_settings.program_id) {
        fields.push({
            name: 'programId',
            value: currentMappingVersion.derivate_settings.program_id,
            message: MESSAGES.program,
        });
    }

    if (currentMappingVersion.dataset.name) {
        fields.push({
            name: 'datasetName',
            value: currentMappingVersion.dataset.name,
            message: MESSAGES.dataset,
        });
    }
    if (currentMappingVersion.dataset.id) {
        fields.push({
            name: 'datasetId',
            value: currentMappingVersion.dataset.id,
            message: MESSAGES.dataset,
        });
    }

    if (currentMappingVersion.derivate_settings.formId) {
        fields.push({
            name: 'formId',
            value: currentMappingVersion.derivate_settings.formId,
        });
    }

    return fields;
}

type Props = {
    // from the untyped /api/mappingversions/ serializer
    currentMappingVersion: Record<string, any>;
    applyUpdate: Record<string, any>;
    statusCounts: Record<QuestionStatus, number>;
    // undefined when every question is mapped
    onNextUnmapped?: () => void;
};

const GeneraMappingInfo = ({
    currentMappingVersion,
    applyUpdate,
    statusCounts,
    onNextUnmapped,
}: Props) => {
    const { formatMessage } = useSafeIntl();
    const [eventDateSource, setEventDateSource] = React.useState(
        currentMappingVersion.derivate_settings.event_date_source ||
            evenDateOptions[0].value,
    );

    const fieldValues = useMemo(
        () => toGeneralFields(currentMappingVersion),
        [currentMappingVersion],
    );
    const hasEventDateSource = ['EVENT', 'EVENT_TRACKER'].includes(
        currentMappingVersion.mapping.mapping_type,
    );
    return (
        <>
            <Alert severity="info" sx={styles.hint}>
                {formatMessage(MESSAGES.generalHint)}
            </Alert>
            <MappingCard title={formatMessage(MESSAGES.generalTitle)}>
                <Box sx={styles.fields}>
                    <LabeledValue
                        label={formatMessage(MESSAGES.formVersion)}
                        value={currentMappingVersion.form_version.version_id}
                    />
                    {fieldValues.map(fieldValue => (
                        <LabeledValue
                            key={fieldValue.name}
                            label={
                                fieldValue.message
                                    ? formatMessage(fieldValue.message)
                                    : fieldValue.name
                            }
                            value={fieldValue.value}
                        />
                    ))}
                </Box>
                <Box sx={styles.stats}>
                    <LabeledValue
                        label={formatMessage(MESSAGES.statusMapped)}
                        value={statusCounts[QuestionStatus.MAPPED]}
                    />
                    <LabeledValue
                        label={formatMessage(MESSAGES.statusUnmapped)}
                        value={statusCounts[QuestionStatus.UNMAPPED]}
                    />
                    <LabeledValue
                        label={formatMessage(MESSAGES.statusNever)}
                        value={statusCounts[QuestionStatus.NEVER]}
                    />
                </Box>
                <Box sx={styles.section}>
                    {hasEventDateSource && (
                        <Box sx={styles.eventDateSource}>
                            <InputComponent
                                keyValue="event_period_source"
                                onChange={(key, value) =>
                                    setEventDateSource(value)
                                }
                                value={eventDateSource}
                                type="select"
                                options={evenDateOptions}
                                label={MESSAGES.eventDateSource}
                                withMarginTop={false}
                            />
                        </Box>
                    )}
                    <Box sx={styles.actions}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                                applyUpdate.mutate({
                                    mappingVersionId: currentMappingVersion.id,
                                    payload: {
                                        event_date_source: eventDateSource,
                                    },
                                });
                            }}
                        >
                            {formatMessage(MESSAGES.update)}
                        </Button>
                        <Button
                            variant="text"
                            color="primary"
                            endIcon={<ArrowForward />}
                            disabled={!onNextUnmapped}
                            onClick={onNextUnmapped}
                        >
                            {formatMessage(MESSAGES.nextUnmapped)}
                        </Button>
                    </Box>
                </Box>
            </MappingCard>
        </>
    );
};

export default GeneraMappingInfo;
