import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import _ from 'lodash';
import Descriptor from '../descriptor';

import { isMapped, isNeverMapped } from '../question_mappings';

const useStyles = makeStyles(theme => ({
    root: {
        height: 'calc(100vh - 64px)',
        flexGrow: 1,
        overflow: 'auto',
    },
    mapped: {
        color: 'green',
    },
    neverMapped: {
        color: theme.palette.gray.main,
    },
}));

const RecursiveTreeView = props => {
    const classes = useStyles();
    const { formVersion, mappingVersion, onQuestionSelected } = props;

    const { descriptor } = formVersion;
    const indexedQuestions = Descriptor.indexQuestions(descriptor);

    const onNodeSelected = (event, value) => {
        const val = indexedQuestions[value];
        if (val && val.type !== 'group') {
            onQuestionSelected(val);
        }
    };
    const renderTree = (node, isTopNode = false) => {
        const coverage = Descriptor.getCoverage(
            indexedQuestions,
            mappingVersion,
            node,
            isTopNode,
        );
        const questionMapping = mappingVersion.question_mappings[node.name];
        const mapped = isMapped(questionMapping);
        const neverMapped = isNeverMapped(questionMapping);

        const allChidrenMapped =
            Descriptor.hasChildren(node) && coverage[0] === coverage[1];
        let className = '';
        if (neverMapped) {
            className = classes.neverMapped;
        }
        if (mapped || allChidrenMapped) {
            className = classes.mapped;
        }
        return (
            <TreeItem
                key={node.name}
                nodeId={node.name}
                label={`${_.truncate(Descriptor.getHumanLabel(node))} (${
                    Descriptor.hasChildren(node)
                        ? ` ${coverage.join(' / ')}`
                        : node.type
                })`}
                title={Descriptor.getHumanLabel(node)}
                className={className}
            >
                {Descriptor.hasChildren(node)
                    ? node.children.map(n => renderTree(n))
                    : null}
            </TreeItem>
        );
    };

    return (
        <div className={classes.root}>
            <TreeView
                className={classes.root}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpanded={[descriptor.name]}
                defaultExpandIcon={<ChevronRightIcon />}
                onNodeSelect={onNodeSelected}
            >
                {renderTree(descriptor, true)}
            </TreeView>
        </div>
    );
};

export default RecursiveTreeView;
