import React from "react";

const QuestionInfos = ({ question }) => (
  <div>
    <h2>{question.label + " - " + question.name}</h2>
    Name : {question.name} <br />
    Label : {question.label} <br />
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

export default QuestionInfos;
