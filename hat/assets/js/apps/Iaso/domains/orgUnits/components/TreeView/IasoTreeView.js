import { string, bool, arrayOf, func, array, oneOfType } from 'prop-types';
import React, { useCallback } from 'react';
import { TreeView } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { EnrichedTreeItem } from './EnrichedTreeItem';
import { useAPI } from '../../../../utils/requests';

const styles = theme => ({
    root: {
        color: theme.palette.gray.main,
        backgroundColor: theme.palette.ligthGray.main,
        borderRadius: '7px',
        maxHeight: '60vh',
        overflowY: 'scroll',
    },
});

const useStyles = makeStyles(styles);

const IasoTreeView = ({
    getChildrenData,
    getRootData,
    labelField, // name
    nodeField, // id
    multiselect,
    expanded,
    selected,
    onToggle,
    toggleOnLabelClick,
    onSelect,
    onCheckBoxClick,
    onLabelClick,
    ticked,
    parentsTicked,
    scrollIntoView,
}) => {
    const classes = useStyles();
    const fetchChildrenData = useCallback(getChildrenData, []);
    const { data: rootData } = useAPI(getRootData);
    const onNodeToggle = (_event, nodeIds) => {
        onToggle(nodeIds);
    };
    const onNodeSelect = (_event, selection) => {
        onSelect(selection);
    };
    const makeChildren = useCallback(
        data => {
            if (!data) return null;
            return data.map(item => (
                <EnrichedTreeItem
                    label={item[labelField]}
                    id={item[nodeField].toString()}
                    data={item.data}
                    key={`RootTreeItem ${item[nodeField]}`}
                    fetchChildrenData={fetchChildrenData}
                    expanded={expanded}
                    selected={selected}
                    hasChildren={item.hasChildren}
                    toggleOnLabelClick={toggleOnLabelClick}
                    onCheckBoxClick={onCheckBoxClick}
                    onLabelClick={onLabelClick}
                    withCheckbox={multiselect}
                    ticked={ticked}
                    parentsTicked={parentsTicked}
                    scrollIntoView={scrollIntoView}
                />
            ));
        },
        [expanded, ticked],
    );
    return (
        <TreeView
            classes={{ root: classes.root }}
            expanded={expanded}
            selected={selected}
            multiSelect={multiselect}
            onNodeSelect={onNodeSelect}
            onNodeToggle={onNodeToggle}
        >
            {rootData && makeChildren(rootData)}
        </TreeView>
    );
};

IasoTreeView.propTypes = {
    getChildrenData: func,
    getRootData: func,
    labelField: string.isRequired,
    nodeField: string.isRequired,
    multiselect: bool,
    toggleOnLabelClick: bool,
    expanded: arrayOf(string).isRequired,
    onToggle: func.isRequired,
    onSelect: func,
    onCheckBoxClick: func,
    onLabelClick: func,
    selected: oneOfType([string, arrayOf(string)]),
    ticked: oneOfType([string, arrayOf(string)]),
    parentsTicked: array,
    scrollIntoView: string,
};

IasoTreeView.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    multiselect: false,
    toggleOnLabelClick: true,
    onSelect: () => {},
    onCheckBoxClick: () => {},
    onLabelClick: () => {},
    selected: undefined,
    ticked: [],
    parentsTicked: [],
    scrollIntoView: null,
};

export { IasoTreeView };
