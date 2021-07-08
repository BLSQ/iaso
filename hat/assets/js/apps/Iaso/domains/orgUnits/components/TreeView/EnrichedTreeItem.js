import React, { useState, useEffect, useCallback } from 'react';
import { string, func, arrayOf, bool, element } from 'prop-types';
import { TreeItem } from '@material-ui/lab';
import { useSafeIntl } from 'bluesquare-components';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useAPI } from '../../../../utils/requests';
import { MESSAGES } from './messages';

const EnrichedTreeItem = ({
    label,
    id,
    hasChildren,
    fetchChildrenData, // fetchChildrenData(id)
    expanded,
    notifyParent,
    toggleOnLabelClick,
    // icon,  //for checkboxes
    // onIconClick, // for checkboxes
    // selected,
}) => {
    // TODO add a condition that triggers API call --> NodeToggle
    // TODO add conditional rendering based on whether value from call exists or not
    // TODO check performance of the hook with large tree (useEffect related renders)
    const isExpanded = expanded.includes(id);
    // const [isExpanded, setIsExpanded] = useState(false);
    const { data: childrenData, isLoading } = useAPI(fetchChildrenData, id, {
        preventTrigger: !isExpanded,
    });

    const { formatMessage } = useSafeIntl();
    // This kinda stinks as it will make the parent TreeView re-render
    // It should also be replaced by onNodeToggle so Icon can be freed for use as checkbox
    // const onIconClick = useCallback(
    //     e => {
    //         e.preventDefault;
    //         onIconClick()
    //     },
    //     [notifyParent, expanded],
    // );
    const onLabelClick = e => {
        if (!toggleOnLabelClick) {
            e.preventDefault();
        }
    };

    const makeSubTree = data => {
        if (!data) return null;
        return data.map(unit => (
            <EnrichedTreeItem
                key={`TreeItem ${unit.id}`}
                label={unit.name}
                id={unit.id.toString()}
                fetchChildrenData={fetchChildrenData}
                expanded={expanded}
                notifyParent={notifyParent}
                hasChildren={unit.hasChildren}
                toggleOnLabelClick={toggleOnLabelClick}
                // onIconClick={onIconClick}
            />
        ));
    };
    if (isExpanded && isLoading) {
        return (
            <TreeItem label={label} nodeId={id} icon={<ExpandMoreIcon />}>
                {formatMessage(MESSAGES.loading)}
            </TreeItem>
        );
    }
    // TODO make better conditionals
    if (hasChildren) {
        return (
            <TreeItem
                label={label}
                nodeId={id}
                collapseIcon={<ExpandMoreIcon />}
                expandIcon={<ChevronRightIcon />}
                onLabelClick={onLabelClick}
                // onIconClick={onIconClick}
                // icon={<ExpandMoreIcon />}
            >
                {childrenData && isExpanded && makeSubTree(childrenData)}
                {!isExpanded && <div />}
            </TreeItem>
        );
    }
    return (
        <TreeItem
            label={label}
            nodeId={id}
            collapseIcon={<ExpandMoreIcon />}
            expandIcon={<ChevronRightIcon />}
            // icon={<ChevronRightIcon />}
            // onIconClick={onIconClick}
        />
    );
};

const noOp = () => {};

EnrichedTreeItem.propTypes = {
    label: string.isRequired,
    id: string.isRequired,
    // children: oneOfType([element, arrayOf(element)]),
    // should be wrapped in useCallback by parent
    fetchChildrenData: func,
    expanded: arrayOf(string),
    notifyParent: func.isRequired,
    hasChildren: bool,
    // icon: element,
    // selected: bool,
    // onIconClick:func,
    toggleOnLabelClick: bool,
    // onIconClick: func,
};

EnrichedTreeItem.defaultProps = {
    // children: null,
    fetchChildrenData: noOp,
    expanded: [],
    hasChildren: false,
    // icon: null,
    // oniconClick:()=>{},
    // selected: false,
    toggleOnLabelClick: true,
    // onIconClick: () => {},
};

export { EnrichedTreeItem };
