import Alert from '@material-ui/lab/Alert';
import PropTypes from 'prop-types';
import React from 'react';
import { Select } from 'bluesquare-components';
import { isMapped, isNeverMapped } from '../question_mappings';
import Dhis2SearchComponent from './Dhis2SearchComponent';
import { DuplicateHint } from './DuplicateHint';
import HesabuHint from './HesabuHint';
import ObjectDumper from './ObjectDumper';
import Descriptor from '../descriptor';
import EventTrackerProgramForm from './EventTrackerProgramForm';

const iasoFieldOptions = [
    { value: undefined, label: "Use the value from the form's answer" },
    { value: 'instance.org_unit.source_ref', label: 'Instance orgunit' },
];

const fieldTypeOptions = [
    { value: 'trackedEntityAttribute', label: 'Tracked Entity Attribute' },
    { value: 'dataElement', label: 'Program data element' },
];

const Dhis2ProgramTrackedEntityAttributeSearch = ({
    questionMapping,
    mapping,
    onChange,
    question,
    programId,
}) => {
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
            label="Search for tracked entity type attribute"
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
            label="Search for tracker data element (and combo) by name, code or id"
            onChange={onChange}
            // TODO find a better way to format/concat theis string
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

const QuestionMappingForm = ({
    mapping,
    question,
    mappingVersion,
    indexedQuestions,
    onConfirmedQuestionMapping,
    onUnmapQuestionMapping,
    onNeverMapQuestionMapping,
    hesabuDescriptor,
}) => {
    const questionMapping = mapping.question_mappings[question.name] || {};
    const [newQuestionMapping, setNewQuestionMapping] = React.useState();
    const [iasoField, setIasoField] = React.useState(iasoFieldOptions[0]);
    const [fieldType, setFieldType] = React.useState(fieldTypeOptions[1]);

    if (indexedQuestions === undefined) {
        return <>Loading...</>;
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
            {questionMapping.id && (
                <>
                    <h3>Current Mapping</h3>
                    <ObjectDumper object={questionMapping} />
                </>
            )}

            <div>
                withinRepeatGroup ? {withinRepeatGroup}{' '}
                {JSON.stringify(repeatGroupMapping)}
            </div>

            {isMapped(questionMapping) && (
                <>
                    <DuplicateHint
                        mapping={questionMapping}
                        mappingVersion={mappingVersion}
                    />
                    <HesabuHint
                        mapping={questionMapping}
                        hesabuDescriptor={hesabuDescriptor}
                    />
                    <br />
                    <button
                        className="button"
                        onClick={() => onUnmapQuestionMapping(questionMapping)}
                    >
                        Remove mapping
                    </button>
                </>
            )}
            {!isMapped(questionMapping) && !isNeverMapped(questionMapping) && (
                <button
                    className="button"
                    onClick={() => onNeverMapQuestionMapping(questionMapping)}
                >
                    Will never map
                </button>
            )}
            {isNeverMapped(questionMapping) && (
                <Alert severity="info">
                    This question is considered to be never mapped but you can
                    change your mind
                </Alert>
            )}
            <br />
            <br />
            <h3>Change the mapping to existing one :</h3>
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
                    label="Search for data element (and combo) by name, code or id"
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
                        options={fieldTypeOptions}
                        value={fieldType}
                        onChange={setFieldType}
                    />
                    {fieldType && (
                        <>
                            {fieldType.value === 'dataElement' && (
                                <Dhis2ProgramDataElementSearch
                                    question={question}
                                    onChange={onChange}
                                    mapping={mapping}
                                    questionMapping={questionMapping}
                                    programId={programId}
                                />
                            )}
                            {fieldType.value === 'trackedEntityAttribute' && (
                                <Dhis2ProgramTrackedEntityAttributeSearch
                                    question={question}
                                    onChange={onChange}
                                    mapping={mapping}
                                    questionMapping={questionMapping}
                                    programId={programId}
                                />
                            )}
                            <p>Use instance property to fill in this answer</p>
                            <Select
                                options={iasoFieldOptions}
                                value={iasoField}
                                onChange={setIasoField}
                            />
                        </>
                    )}

                    {questionMapping.map &&
                        questionMapping.map((q, index) => (
                            <ObjectDumper key={index} object={q} />
                        ))}
                </div>
            )}

            {newQuestionMapping && (
                <>
                    <br />
                    <h3>Proposed new one :</h3>
                    <br />
                    <ObjectDumper object={newQuestionMapping} />
                    <HesabuHint
                        mapping={newQuestionMapping}
                        hesabuDescriptor={hesabuDescriptor}
                    />
                    <DuplicateHint
                        mapping={newQuestionMapping}
                        mappingVersion={mappingVersion}
                    />
                    <br />
                    <button
                        className="button"
                        disabled={!newQuestionMapping}
                        onClick={() => {
                            let item = newQuestionMapping;
                            if (
                                mapping.mapping.mapping_type === 'EVENT_TRACKER'
                            ) {
                                item = [{ ...newQuestionMapping }];
                                if (
                                    iasoField &&
                                    iasoField.value !== 'undefined'
                                ) {
                                    item = [
                                        {
                                            ...newQuestionMapping,
                                            iaso_field: iasoField.value,
                                        },
                                    ];
                                }
                            }

                            onConfirmedQuestionMapping(item);
                        }}
                    >
                        Confirm
                    </button>
                </>
            )}
        </>
    );
};

QuestionMappingForm.defaultProps = {
    hesabuDescriptor: [],
};

QuestionMappingForm.propTypes = {
    mapping: PropTypes.object.isRequired,
    question: PropTypes.object.isRequired,
    mappingVersion: PropTypes.object.isRequired,
    indexedQuestions: PropTypes.object.isRequired,
    onConfirmedQuestionMapping: PropTypes.func.isRequired,
    onUnmapQuestionMapping: PropTypes.func.isRequired,
    onNeverMapQuestionMapping: PropTypes.func.isRequired,
    hesabuDescriptor: PropTypes.array,
};
export default QuestionMappingForm;
