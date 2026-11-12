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

type Props = {
    dataSourceId: number;
    repeatGroupMapping: any;
    onConfirmedQuestionMapping: (questionMapping: Record<string, any>) => void;
};

const EventTrackerProgramForm: FunctionComponent<Props> = ({
    dataSourceId,
    repeatGroupMapping,
    onConfirmedQuestionMapping,
}) => {
    const { formatMessage } = useSafeIntl();
    const [program, setProgram] = React.useState('');
    const [trackedEntityAttributes, setTrackedEntityAttributes] =
        React.useState([]);
    const [trackedEntityIdentifier, setTrackedEntityIdentifier] =
        React.useState(null);
    const [relationshipType, setRelationshipType] = React.useState(null);
    const [proposedNewMapping, setProposedNewMapping] = React.useState(null);
    const trackedEntityAttributeOptions = trackedEntityAttributes.map(a => ({
        value: a.id,
        label: a.name,
    }));
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
                        onChange={(name, val) => {
                            setProgram(val);

                            setTrackedEntityAttributes(
                                val
                                    ? val.trackedEntityType.trackedEntityTypeAttributes.map(
                                          teat => teat.trackedEntityAttribute,
                                      )
                                    : [],
                            );
                        }}
                    />
                    <InputComponent
                        keyValue="trackedEntityIdentifier"
                        onChange={(key, value) => {
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
                        onChange={(name, val) => {
                            setRelationshipType(val);
                            setProposedNewMapping({
                                type: 'repeat',
                                program_id: program.id,
                                program_name: program.name,
                                tracked_entity_type:
                                    program.trackedEntityType.id,
                                tracked_entity_identifier:
                                    trackedEntityIdentifier,
                                relationship_type: val.id,
                                relationship_type_name: val.name,
                            });
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
                                disabled={
                                    !(
                                        trackedEntityIdentifier &&
                                        relationshipType &&
                                        program
                                    )
                                }
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
