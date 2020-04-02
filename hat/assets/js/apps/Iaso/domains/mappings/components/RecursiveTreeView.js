import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import TreeItem from "@material-ui/lab/TreeItem";

const useStyles = makeStyles({
  root: {
    height: 110,
    flexGrow: 1,
    maxWidth: 600,
    maxHeight: 500
  },
  mapped: {
    color: "green"
  }
});

const hasChildren = node => {
  return Array.isArray(node.children) && node.type !== "select one";
};

const getHumanLabel = node => {
  return node.title || node.label || node.hint;
};
const getHumanToolTip = node => {
  return ["title", node.title, "label", node.label, "hint", node.hint].join(
    "\n"
  );
};

const recursiveIndex = (node, acc) => {
  acc[node.name] = node;
  if (hasChildren(node)) {
    node.children.forEach(child => {
      child.parent_name = node.name;
      recursiveIndex(child, acc);
    });
  }
};
const indexQuestions = descriptor => {
  const acc = {};
  descriptor.children.forEach(child => recursiveIndex(child, acc));
  return acc;
};

const getCoverage = (indexedQuestions, mappingVersion, node) => {
  const questions = Object.values(indexedQuestions).filter(
    q => q.parent_name == node.name
  );

  const mappedQuestions = questions.filter(
    q => mappingVersion.question_mappings[q.name]
  );
  return mappedQuestions.length + " / " + questions.length;
};
const RecursiveTreeView = props => {
  const classes = useStyles();
  const { formVersion, mappingVersion, onQuestionSelected } = props;

  const descriptor = formVersion.descriptor;
  const indexedQuestions = indexQuestions(formVersion.descriptor);

  const onNodeSelected = (event, value) => {
    const val = indexedQuestions[value];
    if (val && val.type !== "group") {
      onQuestionSelected(val);
    }
  };
  const renderTree = node => (
    <TreeItem
      key={node.name}
      nodeId={node.name}
      label={
        getHumanLabel(node) +
        " (" +
        (hasChildren(node)
          ? " " + getCoverage(indexedQuestions, mappingVersion, node)
          : node.type) +
        ")"
      }
      className={
        mappingVersion.question_mappings[node.name] ? classes.mapped : ""
      }
    >
      {hasChildren(node) ? node.children.map(node => renderTree(node)) : null}
    </TreeItem>
  );

  return (
    <div className={classes.root}>
      <TreeView
        className={classes.root}
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpanded={[descriptor.title]}
        defaultExpandIcon={<ChevronRightIcon />}
        onNodeSelect={onNodeSelected}
      >
        {renderTree(descriptor)}
      </TreeView>
    </div>
  );
};

export default RecursiveTreeView;
