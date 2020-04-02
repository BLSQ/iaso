import React from "react";

const QuestionMappingForm = ({ mapping, question }) => {
  const questionMapping = mapping.question_mappings[question.name] || {};

  return (
    <>
      <h3>Mapping</h3>
      <p>Id: {questionMapping.id}</p>
      <p>valueType: {questionMapping.valueType}</p>
      <p>categoryOptionCombo: {questionMapping.categoryOptionCombo}</p>
      <p>{JSON.stringify(questionMapping)}</p>
    </>
  );
};
export default QuestionMappingForm;
