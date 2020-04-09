import React from 'react';
import PropTypes from 'prop-types';
import Alert from '@material-ui/lab/Alert';
import Dhis2SearchComponent from './Dhis2SearchComponent';
import HesabuHint from './HesabuHint';
import ObjectDumper from './ObjectDumper';

import { isMapped, isNeverMapped } from '../question_mappings';
import { DuplicateHint } from './DuplicateHint';

const QuestionMappingForm = ({
    mapping,
    question,
    mappingVersion,
    onConfirmedQuestionMapping,
    onUnmapQuestionMapping,
    onNeverMapQuestionMapping,
    hesabuDescriptor,
}) => {
    const questionMapping = mapping.question_mappings[question.name] || {};
    const [newQuestionMapping, setNewQuestionMapping] = React.useState();
    const onChange = (name, value) => {
        setNewQuestionMapping(value);
    };

    const mapToMapping = (options) => {
        const results = [];
        options
            .filter(de => (mappingVersion.mapping.mapping_type == 'AGGREGATE'
                ? de.domainType !== 'TRACKER'
                : de.domainType !== 'AGGREGATE'))
            .forEach((dataElement) => {
                dataElement.categoryCombo.categoryOptionCombos.forEach((coc) => {
                    results.push({
                        id: dataElement.id,
                        name: dataElement.name,
                        displayName:
              dataElement.categoryCombo.name == 'default'
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
    return (
        <>
            {questionMapping.id && (
            <>
                <h3>Current Mapping</h3>
                <ObjectDumper object={questionMapping} />
            </>
            )}

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
            )
            }
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
      This question is considered to be never mapped but you can change your mind
                </Alert>
            )}
            <br />
            <br />
            <h3>Change the mapping to existing one :</h3>
            <Dhis2SearchComponent
                key={question.name}
                resourceName="dataElements"
                dataSourceId={mapping.mapping.data_source.id}
                defaultValue={
                    !isMapped(questionMapping) && !isNeverMapped(questionMapping) ? question.name : undefined
                }
                label="Search for data element (and combo) by name, code or id"
                filter={
                    // TODO not working endpoint send the first filter
                    mapping.mapping_type === 'AGGREGATE' ? 'domainType:eq:AGGREGATE' : ''
                }
                onChange={onChange}
                fields="id,name,valueType,domainType,optionSet[options[id,name,code]],categoryCombo[id,name,categoryOptionCombos[id,name]],dataSetElements[dataSet[id,name,periodType]]"
                mapOptions={mapToMapping}
            />

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
                    onClick={() => onConfirmedQuestionMapping(newQuestionMapping)}
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
    onConfirmedQuestionMapping: PropTypes.func.isRequired,
    onUnmapQuestionMapping: PropTypes.func.isRequired,
    onNeverMapQuestionMapping: PropTypes.func.isRequired,
    hesabuDescriptor: PropTypes.array,
};
export default QuestionMappingForm;
