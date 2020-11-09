import React from 'react';
import Grid from '@material-ui/core/Grid';
import Dhis2Search from './Dhis2SearchComponent';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import ObjectDumper from './ObjectDumper';

const EventTrackerProgramForm = ({
    dataSourceId,
    repeatGroupMapping,
    onConfirmedQuestionMapping,
}) => {
    const [program, setProgram] = React.useState('');
    const [
        trackedEntityAttributes,
        setTrackedEntityAttributes,
    ] = React.useState([]);
    const [
        trackedEntityIdentifier,
        setTrackedEntityIdentifier,
    ] = React.useState(null);
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
                    <h3>Current Mapping</h3>
                    <ObjectDumper object={repeatGroupMapping[0]} />
                </>
            </Grid>
            <Grid>
                <Dhis2Search
                    resourceName="programs"
                    fields="id,name,trackedEntityType[id,name,trackedEntityTypeAttributes[trackedEntityAttribute[id,name]],"
                    label="program"
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
                    label="Relationship type"
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
                    <h3>Proposed new mapping</h3>
                    <ObjectDumper object={proposedNewMapping} />
                </>
            </Grid>
            <Grid>
                <br />
                <button
                    className="button"
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
                    Confirm
                </button>
            </Grid>
        </Grid>
    );
};

export default EventTrackerProgramForm;
