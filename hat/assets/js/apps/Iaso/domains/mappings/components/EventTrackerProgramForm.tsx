import React, { FunctionComponent } from 'react';
import Grid from '@mui/material/Grid';
import { useSafeIntl } from 'bluesquare-components';
import { Button } from '@mui/material';
import Dhis2Search from './Dhis2SearchComponent';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import ObjectDumper from './ObjectDumper';

type Props = {
    dataSourceId: number;
    repeatGroupMapping: any;
    onConfirmedQuestionMapping: Function;
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
        <Grid container spacing={1} direction="column">
            <Grid>
                <>
                    <h3>{formatMessage(MESSAGES.currentMapping)}</h3>
                    <ObjectDumper object={repeatGroupMapping[0]} />
                </>
            </Grid>
            <Grid>
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
            </Grid>
            <Grid>
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
            </Grid>
            <Grid>
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
                            tracked_entity_type: program.trackedEntityType.id,
                            tracked_entity_identifier: trackedEntityIdentifier,
                            relationship_type: val.id,
                            relationship_type_name: val.name,
                        });
                    }}
                />
            </Grid>
            <Grid>
                <>
                    <h3>{formatMessage(MESSAGES.proposedNewMapping)}</h3>
                    <ObjectDumper object={proposedNewMapping} />
                </>
            </Grid>
            <Grid>
                <br />
                <Button
                    // className="button"
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
                        onConfirmedQuestionMapping([proposedNewMapping]);
                    }}
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </Grid>
        </Grid>
    );
};

export default EventTrackerProgramForm;
