import React from 'react';
import { string, func, arrayOf, bool, any } from 'prop-types';
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
    // notifyParent,
    toggleOnLabelClick,
    // icon,  //for checkboxes
    onIconClick, // for checkboxes
    onLabelClick,
    data, // additional data that can be passed up to the parent (eg org unit details)
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

    const handleLabelClick = e => {
        if (!toggleOnLabelClick) {
            e.preventDefault();
        }
        onLabelClick(data);
    };

    // eslint-disable-next-line no-unused-vars
    const handleIconClick = e => {
        // e.preventDefault();
        onIconClick(data);
    };

    const makeSubTree = subTreeData => {
        if (!subTreeData) return null;
        return subTreeData.map(unit => (
            <EnrichedTreeItem
                key={`TreeItem ${unit.id}`}
                label={unit.name}
                id={unit.id.toString()}
                fetchChildrenData={fetchChildrenData}
                expanded={expanded}
                hasChildren={unit.hasChildren}
                toggleOnLabelClick={toggleOnLabelClick}
                onIconClick={onIconClick}
                onLabelClick={onLabelClick}
                data={unit.data ?? null}
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
                onIconClick={handleIconClick}
                onLabelClick={handleLabelClick}
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
            onIconClick={handleIconClick}
            onLabelClick={handleLabelClick}
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
    hasChildren: bool,
    // icon: element,
    onIconClick: func,
    toggleOnLabelClick: bool,
    data: any,
    onLabelClick: func,
};

EnrichedTreeItem.defaultProps = {
    // children: null,
    fetchChildrenData: noOp,
    expanded: [],
    hasChildren: false,
    toggleOnLabelClick: true,
    onIconClick: () => {},
    onLabelClick: () => {},
    data: null,
};

export { EnrichedTreeItem };
