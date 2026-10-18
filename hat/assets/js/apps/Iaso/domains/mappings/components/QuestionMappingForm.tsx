import React, { FunctionComponent } from 'react';
import { Block, Delete } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { LoadingSpinner, Select, useSafeIntl } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { SxStyles } from '../../../types/general';
import Descriptor from '../descriptor';
import { getMappingLabel } from '../importMappings';
import MESSAGES from '../messages';
import { isMapped, isNeverMapped } from '../question_mappings';
import { buildQuestionMapping, isOrgUnitTarget } from '../utils';
import Dhis2SearchComponent from './Dhis2SearchComponent';
import { DuplicateHint } from './DuplicateHint';
import EventTrackerProgramForm from './EventTrackerProgramForm';
import { MappingCard } from './QuestionPanel/MappingCard';
import { MappingSummary } from './QuestionPanel/MappingSummary';

const styles: SxStyles = {
    actions: {
        display: 'flex',
        gap: 1,
        mt: 2,
    },
    repeatGroup: {
        mt: 1,
    },
    iasoField: {
        mt: 2,
        maxWidth: 500,
    },
    neverHint: {
        alignSelf: 'center',
    },
    proposed: {
        mt: 3,
        pt: 2,
        borderTop: 1,
        borderColor: 'divider',
    },
};

const Dhis2ProgramTrackedEntityAttributeSearch = ({
    questionMapping,
    mapping,
    onChange,
    question,
    programId,
}) => {
    const { formatMessage } = useSafeIntl();
    const mapToTrackedEntityTypeAttributes = (options, input) => {
        const token = input ? input.toLowerCase() : '';
        const results = [];
        options.forEach(program => {
            program.programTrackedEntityAttributes.forEach(
                trackedEntityTypeAttributeRaw => {
                    const trackeEntityAttribute =
                        trackedEntityTypeAttributeRaw.trackedEntityAttribute;
                    if (
                        trackeEntityAttribute.name
                            .toLowerCase()
                            .includes(token) ||
                        (trackeEntityAttribute.code &&
                            trackeEntityAttribute.code
                                .toLowerCase()
                                .includes(token))
                    ) {
                        results.push(trackedEntityTypeAttributeRaw);
                    }
                },
            );
        });
        return results;
    };
    return (
        <Dhis2SearchComponent
            key={question.name}
            resourceName="programs"
            dataSourceId={mapping.mapping.data_source.id}
            defaultValue={
                !isMapped(questionMapping) && !isNeverMapped(questionMapping)
                    ? question.name
                    : undefined
            }
            label={formatMessage(MESSAGES.searchTrackedEntity)}
            onChange={onChange}
            fields="programTrackedEntityAttributes[name,code,trackedEntityAttribute[id,generated,name,code,valueType,optionSet[id,name,code,options[id,code,name]]]]"
            mapOptions={mapToTrackedEntityTypeAttributes}
            fetchFromPromise={(
                input,
                filter,
                pageSize,
                resourceName,
                dataSourceId,
                fields,
            ) =>
                Promise.all([
                    fetch(
                        `/api/datasources/${dataSourceId}/programs.json?filter=id:eq:${programId}&fields=${fields}`,
                    ).then(resp => resp.json()),
                ])
            }
        />
    );
};

const Dhis2ProgramDataElementSearch = ({
    questionMapping,
    mapping,
    onChange,
    question,
    programId,
}) => {
    const { formatMessage } = useSafeIntl();
    const mapToMappingProgramElements = (options, input) => {
        const token = input ? input.toLowerCase() : '';
        const results = [];
        options.forEach(program => {
            program.programStages.forEach(programStage => {
                programStage.programStageDataElements.forEach(
                    programStageElement => {
                        const { dataElement } = programStageElement;
                        if (
                            dataElement.name.toLowerCase().includes(token) ||
                            (dataElement.code &&
                                dataElement.code.toLowerCase().includes(token))
                        ) {
                            dataElement.categoryCombo.categoryOptionCombos.forEach(
                                coc => {
                                    if (
                                        mapping.mapping.mapping_type ===
                                        'EVENT_TRACKER'
                                    ) {
                                        results.push({
                                            name: dataElement.name,
                                            ...programStageElement,
                                            program: program.id,
                                            programStage: programStage.id,
                                            programStageName: programStage.name,
                                        });
                                    } else {
                                        results.push({
                                            id: dataElement.id,
                                            code: dataElement.code,
                                            name: dataElement.name,
                                            displayName: dataElement.name,
                                            valueType: dataElement.valueType,
                                            domainType: dataElement.domainType,
                                            categoryOptionCombo: coc.id,
                                            categoryOptionComboName: coc.name,
                                            optionSet: dataElement.optionSet,
                                        });
                                    }
                                },
                            );
                        }
                    },
                );
            });
        });
        return results;
    };
    return (
        <Dhis2SearchComponent
            key={question.name}
            resourceName="programs"
            dataSourceId={mapping.mapping.data_source.id}
            defaultValue={
                !isMapped(questionMapping) && !isNeverMapped(questionMapping)
                    ? question.name
                    : undefined
            }
            label={formatMessage(MESSAGES.searchTracker)}
            onChange={onChange}
            // eslint-disable-next-line max-len
            fields="id,name,programStages[id,name,programStageDataElements[compulsory,code,dataElement[id,name,code,valueType,domainType,optionSet[options[id,name,code]],categoryCombo[id,name,categoryOptionCombos[id,name]]]]]"
            mapOptions={mapToMappingProgramElements}
            fetchFromPromise={(
                input,
                filter,
                pageSize,
                resourceName,
                dataSourceId,
                fields,
            ) =>
                Promise.all([
                    fetch(
                        `/api/datasources/${dataSourceId}/programs.json?filter=id:eq:${programId}&fields=${fields}`,
                    ).then(resp => resp.json()),
                ])
            }
        />
    );
};
type Props = {
    mapping: Record<string, any>;
    question: Record<string, any>;
    mappingVersion: Record<string, any>;
    indexedQuestions: Record<string, any>;
    onConfirmedQuestionMapping: (questionMapping: Record<string, any>) => void;
    onUnmapQuestionMapping: () => void;
    onNeverMapQuestionMapping: () => void;
    fieldOptions?: any[];
    fieldTypeOptions?: any[];
};

const QuestionMappingForm: FunctionComponent<Props> = ({
    mapping,
    question,
    mappingVersion,
    indexedQuestions,
    onConfirmedQuestionMapping,
    onUnmapQuestionMapping,
    onNeverMapQuestionMapping,
    fieldOptions = [], // should be ordered so state is initalized with 1st element
    fieldTypeOptions = [], // should be ordered so state is initalized with 1st element
}) => {
    const questionMapping =
        mapping.question_mappings[Descriptor.getKey(question)] || {};
    const [newQuestionMapping, setNewQuestionMapping] = React.useState();
    // the Select takes and returns the option value, not the option
    const [iasoField, setIasoField] = React.useState(fieldOptions[0]?.value);
    const [fieldType, setFieldType] = React.useState(
        fieldTypeOptions[0]?.value,
    );
    const { formatMessage } = useSafeIntl();

    if (indexedQuestions === undefined) {
        return <LoadingSpinner />;
    }
    const withinRepeatGroup = Descriptor.withinRepeatGroup(
        question,
        indexedQuestions,
    );

    const onChange = (name, value) => {
        const val = value;
        if (withinRepeatGroup) {
            val.parent = withinRepeatGroup;
        }
        setNewQuestionMapping(val);
    };

    const mapToMapping = options => {
        const results = [];

        options
            .filter(de =>
                mappingVersion.mapping.mapping_type === 'AGGREGATE'
                    ? de.domainType !== 'TRACKER'
                    : de.domainType !== 'AGGREGATE',
            )
            .forEach(dataElement => {
                dataElement.categoryCombo.categoryOptionCombos.forEach(coc => {
                    results.push({
                        id: dataElement.id,
                        name: dataElement.name,
                        displayName:
                            dataElement.categoryCombo.name === 'default'
                                ? dataElement.name
                                : `${dataElement.name} - ${coc.name}`,
                        valueType: dataElement.valueType,
                        domainType: dataElement.domainType,
                        categoryOptionCombo: coc.id,
                        categoryOptionComboName: coc.name,
                        optionSet: dataElement.optionSet,
                        dataSetElements: dataElement.dataSetElements,
                    });
                });
            });
        return results;
    };

    const repeatGroupMapping = mapping.question_mappings[withinRepeatGroup];

    const programId = repeatGroupMapping
        ? repeatGroupMapping[0].program_id
        : mapping.derivate_settings.program_id;

    if (question.type === 'repeat') {
        return (
            <EventTrackerProgramForm
                dataSourceId={mapping.mapping.data_source.id}
                repeatGroupMapping={repeatGroupMapping}
                onConfirmedQuestionMapping={onConfirmedQuestionMapping}
            />
        );
    }

    return (
        <>
            <MappingCard title={formatMessage(MESSAGES.currentMapping)}>
                {/* same layout mapped or not, so moving between questions doesn't shift the page */}
                <MappingSummary
                    mapping={
                        isMapped(questionMapping) ? questionMapping : undefined
                    }
                    mappingType={mapping.mapping.mapping_type}
                    emptyLabel={formatMessage(
                        isNeverMapped(questionMapping)
                            ? MESSAGES.questionNever
                            : MESSAGES.questionUnmapped,
                    )}
                />
                <DuplicateHint
                    mapping={questionMapping}
                    mappingVersion={mappingVersion}
                />
                {repeatGroupMapping && (
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        component="div"
                        sx={styles.repeatGroup}
                    >
                        {formatMessage(MESSAGES.repeatGroup, {
                            program: getMappingLabel(repeatGroupMapping),
                        })}
                    </Typography>
                )}
                <Box sx={styles.actions}>
                    <Button
                        color="error"
                        variant="outlined"
                        startIcon={<Delete />}
                        disabled={!isMapped(questionMapping)}
                        onClick={() => onUnmapQuestionMapping(questionMapping)}
                    >
                        <FormattedMessage {...MESSAGES.removeMapping} />
                    </Button>
                    <Button
                        color="primary"
                        variant="outlined"
                        startIcon={<Block />}
                        disabled={
                            isMapped(questionMapping) ||
                            isNeverMapped(questionMapping)
                        }
                        onClick={() =>
                            onNeverMapQuestionMapping(questionMapping)
                        }
                    >
                        <FormattedMessage {...MESSAGES.willNeverMap} />
                    </Button>
                    {isNeverMapped(questionMapping) && (
                        <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={styles.neverHint}
                        >
                            <FormattedMessage
                                {...MESSAGES.neverMapAlert}
                                values={{ breakLine: ' ' }}
                            />
                        </Typography>
                    )}
                </Box>
            </MappingCard>
            <MappingCard title={formatMessage(MESSAGES.changeMappingTitle)}>
                {mapping.mapping.mapping_type === 'AGGREGATE' && (
                    <Dhis2SearchComponent
                        key={question.name}
                        resourceName="dataElements"
                        dataSourceId={mapping.mapping.data_source.id}
                        defaultValue={
                            !isMapped(questionMapping) &&
                            !isNeverMapped(questionMapping)
                                ? question.name
                                : undefined
                        }
                        label={
                            <FormattedMessage {...MESSAGES.searchDataElement} />
                        }
                        filter={
                            // TODO not working endpoint send the first filter
                            mapping.mapping_type === 'AGGREGATE'
                                ? 'domainType:eq:AGGREGATE'
                                : 'domainType:eq:TRACKER'
                        }
                        onChange={onChange}
                        fields="id,name,valueType,domainType,optionSet[options[id,name,code]],categoryCombo[id,name,categoryOptionCombos[id,name]],dataSetElements[dataSet[id,name,periodType]]"
                        mapOptions={mapToMapping}
                    />
                )}

                {
                    /* there's no relation from data elements to programs, need to fetch program's stages data elements */
                    mapping.mapping.mapping_type === 'EVENT' && (
                        <Dhis2ProgramDataElementSearch
                            question={question}
                            onChange={onChange}
                            mapping={mapping}
                            questionMapping={questionMapping}
                            programId={programId}
                        />
                    )
                }

                {mapping.mapping.mapping_type === 'EVENT_TRACKER' && (
                    <div>
                        <Select
                            keyValue="fieldType"
                            options={fieldTypeOptions}
                            value={fieldType}
                            onChange={setFieldType}
                        />
                        {fieldType && (
                            <>
                                {fieldType === 'dataElement' && (
                                    <Dhis2ProgramDataElementSearch
                                        question={question}
                                        onChange={onChange}
                                        mapping={mapping}
                                        questionMapping={questionMapping}
                                        programId={programId}
                                    />
                                )}
                                {fieldType === 'trackedEntityAttribute' && (
                                    <Dhis2ProgramTrackedEntityAttributeSearch
                                        question={question}
                                        onChange={onChange}
                                        mapping={mapping}
                                        questionMapping={questionMapping}
                                        programId={programId}
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}

                {newQuestionMapping && (
                    <Box sx={styles.proposed}>
                        <Typography
                            variant="subtitle1"
                            color="primary"
                            gutterBottom
                        >
                            {formatMessage(MESSAGES.proposedMapping)}
                        </Typography>
                        <MappingSummary
                            mapping={newQuestionMapping}
                            mappingType={mapping.mapping.mapping_type}
                        />
                        <DuplicateHint
                            mapping={newQuestionMapping}
                            mappingVersion={mappingVersion}
                        />
                        {mapping.mapping.mapping_type === 'EVENT_TRACKER' &&
                            isOrgUnitTarget(newQuestionMapping) && (
                                <Box sx={styles.iasoField}>
                                    <Select
                                        keyValue="iasoField"
                                        label={formatMessage(
                                            MESSAGES.useInstanceProperty,
                                        )}
                                        options={fieldOptions}
                                        value={iasoField}
                                        onChange={setIasoField}
                                    />
                                </Box>
                            )}
                        <Box sx={styles.actions}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() =>
                                    onConfirmedQuestionMapping(
                                        buildQuestionMapping(
                                            newQuestionMapping,
                                            mapping.mapping.mapping_type,
                                            iasoField,
                                        ),
                                    )
                                }
                            >
                                <FormattedMessage {...MESSAGES.confirm} />
                            </Button>
                        </Box>
                    </Box>
                )}
            </MappingCard>
        </>
    );
};

export default QuestionMappingForm;
