import React from "react";
import Descriptor from "../descriptor";
import ObjectDumper from "./ObjectDumper";
import Typography from "@material-ui/core/Typography";
import _ from "lodash";

const QuestionInfos = ({ question }) => {
  const label = Descriptor.getHumanLabel(question);
  return (
    <div>
      <Typography variant="h3" component="h3">
        {_.truncate(label) + " - " + question.name}
      </Typography>
      <br></br>
      <br></br>
      <ObjectDumper object={question} />
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
