import React from "react";

import Dhis2SearchComponent from "./Dhis2SearchComponent";
import HesabuHint from "./HesabuHint";
import ObjectDumper from "./ObjectDumper";
import Alert from "@material-ui/lab/Alert";

const DuplicateHint = ({ mapping, mappingVersion }) => {
  if (mapping == undefined) {
    return <></>;
  }
  const duplicates = [];
  Object.keys(mappingVersion.question_mappings).forEach(question_name => {
    const qmap = mappingVersion.question_mappings[question_name];
    if (qmap) {
      if (
        mapping.id == qmap.id &&
        mapping.categoryOptionCombo == qmap.categoryOptionCombo
      ) {
        duplicates.push(question_name);
      }
    }
  });
  if (duplicates.length <= 1) {
    return <></>;
  }
  return (
    <Alert severity="error">
      Duplicate mapping ! will be used in both {duplicates.join(" , ")}
    </Alert>
  );
};

const QuestionMappingForm = ({
  mapping,
  question,
  mappingVersion,
  onConfirmedQuestionMapping,
  hesabuDescriptor
}) => {
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
          <ObjectDumper object={questionMapping} />
        </>
      )}
      <DuplicateHint
        mapping={questionMapping}
        mappingVersion={mappingVersion}
      />
      <HesabuHint
        mapping={questionMapping}
        hesabuDescriptor={hesabuDescriptor}
      />
      <br />
      <h3>Change the mapping to existing one :</h3>
      <Dhis2SearchComponent
        resourceName="dataElements"
        dataSourceId={mapping.mapping.data_source.id}
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
      {newQuestionMapping && (
        <>
          <br></br>
          <h3>Proposed new one :</h3>
          <br></br>
          <ObjectDumper object={newQuestionMapping} />
        </>
      )}

      <HesabuHint
        mapping={newQuestionMapping}
        hesabuDescriptor={hesabuDescriptor}
      />
      <DuplicateHint
        mapping={newQuestionMapping}
        mappingVersion={mappingVersion}
      />
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
