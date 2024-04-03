import React from 'react';

import InputComponent from '../../../components/forms/InputComponent';
import Alert from '@mui/material/Alert';
import MESSAGES from '../messages';
import { Button } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';

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

const GeneraMappingInfo = ({ currentMappingVersion, applyUpdate }) => {
    const { formatMessage } = useSafeIntl();
    const [eventDateSource, setEventDateSource] = React.useState(
        currentMappingVersion.derivate_settings.event_date_source ||
            evenDateOptions[0].value,
    );
    return (
        <div>
            <Alert severity="info">{formatMessage(MESSAGES.generalHint)}</Alert>
            <h1>{formatMessage(MESSAGES.generalTitle)}</h1>

            <table width="600px">
                <tbody>
                    {toGeneralFields(currentMappingVersion).map(fieldValue => (
                        <tr key={fieldValue.name}>
                            <td>
                                {fieldValue.message
                                    ? formatMessage(fieldValue.message)
                                    : fieldValue.name}
                            </td>
                            <td>{fieldValue.value}</td>
                        </tr>
                    ))}

                    {currentMappingVersion &&
                        ['EVENT', 'EVENT_TRACKER'].includes(
                            currentMappingVersion.mapping.mapping_type,
                        ) && (
                            <tr>
                                <td>
                                    {formatMessage(MESSAGES.eventDateSource)}
                                </td>
                                <td>
                                    <InputComponent
                                        keyValue="event_period_source"
                                        onChange={(key, value) =>
                                            setEventDateSource(value)
                                        }
                                        value={eventDateSource}
                                        type="select"
                                        options={evenDateOptions}
                                        label={MESSAGES.evenDateSource}
                                    />
                                </td>
                            </tr>
                        )}
                </tbody>
            </table>
     
            <Button
                className="button"
                variant="contained"
                color="primary"
                onClick={() => {
                    applyUpdate(currentMappingVersion.id, {
                        event_date_source: eventDateSource,
                    });
                }}
            >
                Update
            </Button>
        </div>
    );
};

export default GeneraMappingInfo;
