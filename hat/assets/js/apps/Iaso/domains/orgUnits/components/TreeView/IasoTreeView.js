import { string, bool, arrayOf, func, array, oneOfType } from 'prop-types';
import React, { useCallback } from 'react';
import { TreeView } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { CircularProgress, Box } from '@material-ui/core';
import { EnrichedTreeItem } from './EnrichedTreeItem';
import { useRootData } from './requests';

const styles = theme => ({
    root: {
        color: theme.palette.gray.main,
        backgroundColor: theme.palette.ligthGray.main,
        borderRadius: '7px',
        maxHeight: '60vh',
        overflowY: 'scroll',
    },
    isFetching: {
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
    // labelField, // name
    // nodeField, // id
    label,
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
    tailIcon,
}) => {
    const classes = useStyles();
    const fetchChildrenData = useCallback(getChildrenData, [getChildrenData]);
    const { data: rootData, isFetching } = useRootData(getRootData);
    const onNodeToggle = (_event, nodeIds) => {
        onToggle(nodeIds);
    };
    const onNodeSelect = (_event, selection) => {
        onSelect(selection);
    };
    const makeChildren = useCallback(
        data => {
            if (!data) return null;
            return data.map(item => {
                return (
                    <EnrichedTreeItem
                        // label={item[labelField]}
                        label={label}
                        id={item.id}
                        data={item}
                        key={`RootTreeItem ${item.id}`}
                        fetchChildrenData={fetchChildrenData}
                        expanded={expanded}
                        selected={selected}
                        // hasChildren={item.hasChildren}
                        toggleOnLabelClick={toggleOnLabelClick}
                        onCheckBoxClick={onCheckBoxClick}
                        onLabelClick={onLabelClick}
                        withCheckbox={multiselect}
                        ticked={ticked}
                        parentsTicked={parentsTicked}
                        scrollIntoView={scrollIntoView}
                        // tailIcon={tailIcon}
                    />
                );
            });
        },
        [
            // labelField,
            // nodeField,
            label,
            fetchChildrenData,
            expanded,
            selected,
            toggleOnLabelClick,
            onCheckBoxClick,
            onLabelClick,
            multiselect,
            ticked,
            parentsTicked,
            scrollIntoView,
            tailIcon,
        ],
    );
    return (
        <TreeView
            classes={
                isFetching
                    ? { root: classes.isFetching }
                    : { root: classes.root }
            }
            expanded={expanded}
            selected={selected}
            multiSelect={multiselect}
            onNodeSelect={onNodeSelect}
            onNodeToggle={onNodeToggle}
        >
            {!isFetching && rootData && makeChildren(rootData)}
            {isFetching && (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height={100}
                >
                    <CircularProgress />
                </Box>
            )}
        </TreeView>
    );
};

IasoTreeView.propTypes = {
    getChildrenData: func,
    getRootData: func,
    // labelField: string.isRequired,
    // nodeField: string.isRequired,
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
    tailIcon: func,
    label: func.isRequired, // a function that will return the label, including additional icons
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
    tailIcon: () => null,
};

export { IasoTreeView };
