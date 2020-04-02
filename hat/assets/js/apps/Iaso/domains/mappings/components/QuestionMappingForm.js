import React from "react";

import Dhis2SearchComponent from "./Dhis2SearchComponent";

const QuestionMappingForm = ({ mapping, question, mappingVersion, onConfirmedQuestionMapping }) => {
  const questionMapping = mapping.question_mappings[question.name] || {};
  const [newQuestionMapping, setNewQuestionMapping] = React.useState();
  const onChange = (name, value) => {
    setNewQuestionMapping(value);
  };

  const mapToMapping = options => {
    const results = [];
    options
      .filter((
        de //TODO find a way for the api to support multiple filters
      ) =>
        mappingVersion.mapping.mapping_type == "AGGREGATE"
          ? de.domainType !== "TRACKER"
          : de.domainType !== "AGGREGATE"
      )
      .forEach(dataElement => {
        dataElement.categoryCombo.categoryOptionCombos.forEach(coc => {
          results.push({
            id: dataElement.id,
            name: dataElement.name,
            displayName:
              dataElement.categoryCombo.name == "default"
                ? dataElement.name
                : dataElement.name + " - " + coc.name,
            valueType: dataElement.valueType,
            domainType: dataElement.domainType,
            categoryOptionCombo: coc.id,
            categoryOptionComboName: coc.name,
            optionSet: dataElement.optionSet
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
          <p>Id: {questionMapping.id}</p>
          <p>valueType: {questionMapping.valueType}</p>
          <p>categoryOptionCombo: {questionMapping.categoryOptionCombo}</p>
          <p>{JSON.stringify(questionMapping)}</p>
        </>
      )}
      <br />
      <h3>Change the mapping to existing one :</h3>
      <Dhis2SearchComponent
        resourceName="dataElements"
        dataSourceId={3}
        label={"Search for data element (and combo) by name, code or id"}
        filter={
          // TODO not working endpoint send the first filter
          mapping.mapping_type == "AGGREGATE" ? "domainType:eq:AGGREGATE" : ""
        }
        onChange={onChange}
        fields={
          "id,name,valueType,domainType,optionSet[options[id,name]],categoryCombo[id,name,categoryOptionCombos[id,name]]"
        }
        mapOptions={mapToMapping}
      ></Dhis2SearchComponent>
      <pre>
        {newQuestionMapping && JSON.stringify(newQuestionMapping, undefined, 2)}
      </pre>
      <br></br>
      <button
        className="button"
        disabled={newQuestionMapping ? false : true}
        onClick={() => onConfirmedQuestionMapping(newQuestionMapping)}
      >
        Confirm
      </button>
    </>
  );
};
export default QuestionMappingForm;
