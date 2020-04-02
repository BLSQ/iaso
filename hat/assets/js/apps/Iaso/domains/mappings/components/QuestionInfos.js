import React from "react";
import Descriptor from "../descriptor";
const QuestionInfos = ({ question }) => {
  const label = Descriptor.getHumanLabel(question);
  return (
    <div>
      <h2>{label + " - " + question.name}</h2>
      Name : {question.name} <br />
      Label : {label} <br />
      Hint : {question.hint} <br />
      Type : {question.type} <br />
      {question.type == "select one" && (
        <>
          List name : {question.list_name} <br />
        </>
      )}
      {question.bind && question.bind.calculate && (
        <span>Calculate : {question.bind.calculate}</span>
      )}
      {question.children && (
        <> Options : {question.children.map(c => c.name).join(" , ")}</>
      )}
    </div>
  );
};

export default QuestionInfos;
