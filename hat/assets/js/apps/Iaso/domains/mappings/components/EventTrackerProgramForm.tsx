import React, { FunctionComponent } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { SxStyles } from '../../../types/general';
import MESSAGES from '../messages';
import Dhis2Search from './Dhis2SearchComponent';
import { MappingCard } from './QuestionPanel/MappingCard';
import { RepeatSummary } from './QuestionPanel/RepeatSummary';

const styles: SxStyles = {
    fields: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },
    proposed: {
        mt: 3,
        pt: 2,
        borderTop: 1,
        borderColor: 'divider',
    },
    actions: {
        display: 'flex',
        gap: 1,
        mt: 2,
    },
};

type TrackedEntityAttribute = { id: string; name: string };

type Program = {
    id: string;
    name: string;
    trackedEntityType?: {
        id: string;
        trackedEntityTypeAttributes: {
            trackedEntityAttribute: TrackedEntityAttribute;
        }[];
    };
};

type RelationshipType = { id: string; name: string };

type Props = {
    dataSourceId: number;
    repeatGroupMapping?: Record<string, any>[];
    onConfirmedQuestionMapping: (questionMapping: Record<string, any>) => void;
};

const EventTrackerProgramForm: FunctionComponent<Props> = ({
    dataSourceId,
    repeatGroupMapping,
    onConfirmedQuestionMapping,
}) => {
    const { formatMessage } = useSafeIntl();
    const [program, setProgram] = React.useState<Program | null>(null);
    const [trackedEntityIdentifier, setTrackedEntityIdentifier] =
        React.useState<string | null>(null);
    const [relationshipType, setRelationshipType] =
        React.useState<RelationshipType | null>(null);
    const trackedEntityAttributeOptions = (
        program?.trackedEntityType?.trackedEntityTypeAttributes ?? []
    ).map(({ trackedEntityAttribute }) => ({
        value: trackedEntityAttribute.id,
        label: trackedEntityAttribute.name,
    }));
    // built from the 3 choices, whatever order they are made in
    const proposedNewMapping =
        program && trackedEntityIdentifier && relationshipType
            ? {
                  type: 'repeat',
                  program_id: program.id,
                  program_name: program.name,
                  tracked_entity_type: program.trackedEntityType?.id,
                  tracked_entity_identifier: trackedEntityIdentifier,
                  relationship_type: relationshipType.id,
                  relationship_type_name: relationshipType.name,
              }
            : undefined;
    return (
        <>
            <MappingCard title={formatMessage(MESSAGES.currentMapping)}>
                <RepeatSummary
                    item={repeatGroupMapping?.[0] ?? {}}
                    emptyLabel={formatMessage(MESSAGES.questionUnmapped)}
                />
            </MappingCard>
            <MappingCard title={formatMessage(MESSAGES.changeMappingTitle)}>
                <Box sx={styles.fields}>
                    <Dhis2Search
                        resourceName="programs"
                        fields="id,name,trackedEntityType[id,name,trackedEntityTypeAttributes[trackedEntityAttribute[id,name]],"
                        label={formatMessage(MESSAGES.program)}
                        dataSourceId={dataSourceId}
                        onChange={(_name: string, value: Program | null) => {
                            setProgram(value);
                            // the identifier is an attribute of the program
                            setTrackedEntityIdentifier(null);
                        }}
                    />
                    <InputComponent
                        keyValue="trackedEntityIdentifier"
                        onChange={(_key: string, value: string | null) => {
                            setTrackedEntityIdentifier(value);
                        }}
                        value={trackedEntityIdentifier}
                        type="select"
                        options={trackedEntityAttributeOptions}
                        label={MESSAGES.trackerEntityIdentifier}
                    />
                    <Dhis2Search
                        resourceName="relationshipTypes"
                        fields=":all"
                        label={formatMessage(MESSAGES.relationshipType)}
                        dataSourceId={dataSourceId}
                        value={relationshipType}
                        onChange={(
                            _name: string,
                            value: RelationshipType | null,
                        ) => {
                            setRelationshipType(value);
                        }}
                    />
                </Box>
                {proposedNewMapping && (
                    <Box sx={styles.proposed}>
                        <Typography
                            variant="subtitle1"
                            color="primary"
                            gutterBottom
                        >
                            {formatMessage(MESSAGES.proposedMapping)}
                        </Typography>
                        <RepeatSummary item={proposedNewMapping} />
                        <Box sx={styles.actions}>
                            <Button
                                color="primary"
                                variant="contained"
                                onClick={() => {
                                    onConfirmedQuestionMapping([
                                        proposedNewMapping,
                                    ]);
                                }}
                            >
                                {formatMessage(MESSAGES.confirm)}
                            </Button>
                        </Box>
                    </Box>
                )}
            </MappingCard>
        </>
    );
};

export default EventTrackerProgramForm;
