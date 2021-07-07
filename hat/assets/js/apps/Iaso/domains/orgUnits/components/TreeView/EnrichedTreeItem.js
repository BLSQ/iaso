import React, { useState, useEffect, useCallback } from 'react';
import { string, func, arrayOf, bool } from 'prop-types';
import { TreeItem } from '@material-ui/lab';
import { useSafeIntl } from 'bluesquare-components';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useAPI } from '../../../../utils/requests';
import { MESSAGES } from './messages';

// needs to be wrapped in useCallback by parent
// const fetchFunction = async id =>
//     iasoGetRequest({
//         disableSuccessSnackBar: true,
//         requestParams: {
//             url: `/api/orgunits/?&parent_id=${id}&defaultVersion=true&validation_status=all`,
//         },
//     });

// class Model {
//     constructor() {
//         this.id = string;
//         this.name = string;
//         this.hasChildren = bool;
//         return this;
//     }
// }

const EnrichedTreeItem = ({
    label,
    id,
    // children,
    fetchChildrenData, // fetchChildrenData(id)
    expanded,
    notifyParent,
    // selected,
}) => {
    // TODO add a condition that triggers API call --> NodeToggle
    // TODO add conditional rendering based on whether value from call exists or not
    // TODO check performance of the hook with large tree (useEffect related renders)
    const isExpanded = expanded.includes(id);
    // const model = new Model();
    // model.test = 'test';
    // console.log('model', model, model instanceof Model);
    // const [isExpanded, setIsExpanded] = useState(false);
    const { data: childrenData, isLoading } = useAPI(fetchChildrenData, id, {
        preventTrigger: !isExpanded,
    });

    const { formatMessage } = useSafeIntl();
    // This kinda stinks as it will make the parent TreeView re-render
    // It should also be replaced by onNodeToggle so Icon can be freed for use as checkbox
    const onIconClick = useCallback(
        e => {
            e.preventDefault;
            notifyParent([...expanded, id.toString()]);
        },
        [notifyParent, expanded],
    );

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
    // TODO remove the reference to orgUnits
    if (childrenData?.orgUnits) {
        return (
            <TreeItem
                label={label}
                nodeId={id}
                collapseIcon={<ExpandMoreIcon />}
                expandIcon={<ChevronRightIcon />}
                // icon={<ExpandMoreIcon />}
            >
                {isExpanded && makeSubTree(childrenData.orgUnits)}
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
            icon={<ChevronRightIcon />}
            onIconClick={onIconClick}
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
    // selected: bool,
};

EnrichedTreeItem.defaultProps = {
    // children: null,
    fetchChildrenData: noOp,
    expanded: [],
    // selected: false,
};

export { EnrichedTreeItem };
