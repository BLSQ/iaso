import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import TreeItem from "@material-ui/lab/TreeItem";
import Descriptor from "../descriptor";
import _ from "lodash";

const useStyles = makeStyles({
  root: {
    height: 110,
    flexGrow: 1,
    minWidth: 500,
    maxWidth: 600,
    maxHeight: 500
  },
  mapped: {
    color: "green"
  }
});

const RecursiveTreeView = props => {
  const classes = useStyles();
  const { formVersion, mappingVersion, onQuestionSelected } = props;

  const descriptor = formVersion.descriptor;
  const indexedQuestions = Descriptor.indexQuestions(formVersion.descriptor);

  const onNodeSelected = (event, value) => {
    const val = indexedQuestions[value];
    if (val && val.type !== "group") {
      onQuestionSelected(val);
    }
  };
  const renderTree = node => {
    const coverage = Descriptor.getCoverage(
      indexedQuestions,
      mappingVersion,
      node
    );
    const className =
      mappingVersion.question_mappings[node.name] ||
      (Descriptor.hasChildren(node) && coverage[0] == coverage[1])
        ? classes.mapped
        : "";
    return (
      <TreeItem
        key={node.name}
        nodeId={node.name}
        label={
          _.truncate((Descriptor.getHumanLabel(node))) +
          " (" +
          (Descriptor.hasChildren(node)
            ? " " + coverage.join(" / ")
            : node.type) +
          ")"
        }

        className={className}
      >
        {Descriptor.hasChildren(node) ? node.children.map(node => renderTree(node)) : null}
      </TreeItem>
    );
  };

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
