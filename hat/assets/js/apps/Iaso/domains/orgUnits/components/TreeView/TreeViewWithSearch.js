import React, { useState, useCallback } from 'react';
import {
    string,
    bool,
    func,
    object,
    number,
    oneOfType,
    array,
    any,
} from 'prop-types';
import { DynamicSelect } from './DynamicSelect';
import { MESSAGES } from './messages';
import { IasoTreeView } from './IasoTreeView';

const adaptMap = value => {
    if (!value) return null;
    return Array.from(value.entries()) // original map in array form [[key1, entry1],[key2, entry2]]
        .map(entry => Array.from(entry[1].keys())) // 2D array containing the keys of each entry from comment above: [[entry1Key1, entry1Key2],[entry2Key1,entry2Key2]]
        .map(
            keys =>
                keys
                    .map(key => key.toString())
                    .filter(
                        (key, _index, keyArray) =>
                            key !== keyArray[keyArray.length - 1],
                    ), // removing last entry in the array to avoid expanding it
        ) // [["entry1Key1"],["entry2Key1"]]. String conversion needed for Treeview
        .flat();
};

const TreeViewWithSearch = ({
    labelField, // name
    nodeField, // id
    getChildrenData,
    getRootData,
    toggleOnLabelClick,
    onSelect,
    minResultCount,
    inputLabelObject,
    withSearchButton,
    request,
    makeDropDownText,
    toolTip,
    parseNodeIds,
    onLabelClick,
    // onCheckBoxClick,
    multiselect,
    preselected, // TODO rename
    preexpanded, // TODO rename
}) => {
    // TODO Pass selected prop
    const [selected, setSelected] = useState(
        preselected ?? multiselect ? [] : '',
    );
    const [expanded, setExpanded] = useState(adaptMap(preexpanded) ?? []);
    const [ticked, setTicked] = useState(preselected ?? []);
    // TODO pass map to children to neutral tick parents
    // Maybe no state necessary
    const [parentsTicked, setParentsTicked] = useState(
        preexpanded ?? new Map(),
    );

    const onNodeSelect = useCallback(
        selection => {
            setSelected(selection);
            onSelect(selection);
        },
        [onSelect],
    );

    // Tick and untick checkbox
    const handleCheckbox = useCallback(
        (id, data) => {
            const newTicked = ticked.includes(id)
                ? ticked.filter(tickedId => tickedId !== id)
                : [...ticked, id];
            setTicked(newTicked);
            const updatedParents = new Map(parentsTicked);
            if (parentsTicked.has(id)) {
                updatedParents.delete(id);
            } else {
                updatedParents.set(id, data);
            }
            setParentsTicked(updatedParents);

            onLabelClick(newTicked, updatedParents);
        },
        [onLabelClick, ticked, parentsTicked],
    );

    const onSearchSelect = useCallback(
        searchSelection => {
            const idsToExpand = parseNodeIds(searchSelection).map(id =>
                id.toString(),
            );
            if (multiselect) {
                setExpanded([...expanded, ...idsToExpand]);
                const newSelected = [
                    ...selected,
                    idsToExpand[idsToExpand.length - 1],
                ];
                onNodeSelect(newSelected);
            } else {
                setExpanded(idsToExpand);
                onNodeSelect(idsToExpand[idsToExpand.length - 1]);
            }
        },
        [parseNodeIds, onNodeSelect, selected],
    );

    return (
        <>
            <DynamicSelect
                onSelect={onSearchSelect}
                minResultCount={minResultCount}
                inputLabelObject={inputLabelObject}
                withSearchButton={withSearchButton}
                request={request}
                makeDropDownText={makeDropDownText}
                toolTip={toolTip}
            />
            <IasoTreeView
                labelField={labelField}
                nodeField={nodeField}
                getChildrenData={getChildrenData}
                getRootData={getRootData}
                toggleOnLabelClick={toggleOnLabelClick}
                selected={selected}
                onSelect={onNodeSelect}
                expanded={expanded}
                onToggle={setExpanded}
                // onCheckBoxClick={handleCheckbox}
                onLabelClick={handleCheckbox}
                multiselect={multiselect}
                ticked={ticked}
                parentsTicked={adaptMap(parentsTicked)}
            />
        </>
    );
};

TreeViewWithSearch.propTypes = {
    getChildrenData: func,
    getRootData: func,
    labelField: string.isRequired,
    nodeField: string.isRequired,
    toggleOnLabelClick: bool,
    onSelect: func,
    minResultCount: number,
    inputLabelObject: object,
    withSearchButton: bool,
    request: func.isRequired,
    makeDropDownText: func.isRequired,
    toolTip: func,
    parseNodeIds: func.isRequired,
    // onCheckBoxClick: func,
    onLabelClick: func,
    multiselect: bool,
    preselected: oneOfType([string, array]),
    // preexpanded is a Map
    preexpanded: any,
};

TreeViewWithSearch.defaultProps = {
    getChildrenData: () => {},
    getRootData: () => {},
    toggleOnLabelClick: true,
    onSelect: () => {},
    minResultCount: 50,
    inputLabelObject: MESSAGES.search,
    withSearchButton: false,
    toolTip: null,
    // onCheckBoxClick: () => {},
    onLabelClick: () => {},
    multiselect: false,
    preselected: null,
    preexpanded: null,
};

export { TreeViewWithSearch };
