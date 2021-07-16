import React from 'react';
import { string, func, arrayOf, bool, any, array } from 'prop-types';
import { TreeItem } from '@material-ui/lab';
import { useSafeIntl } from 'bluesquare-components';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CheckBoxOutlineBlankOutlinedIcon from '@material-ui/icons/CheckBoxOutlineBlankOutlined';
import CheckBoxOutlinedIcon from '@material-ui/icons/CheckBoxOutlined';
import { useAPI } from '../../../../utils/requests';
import { MESSAGES } from './messages';

const makeIcon = (withCheckbox, ticked) => {
    if (!withCheckbox) return null;
    if (ticked) return <CheckBoxOutlinedIcon />;
    return <CheckBoxOutlineBlankOutlinedIcon />;
};

const makeLabel = (label, withCheckbox, ticked) => (
    <div style={{ display: 'flex' }}>
        {makeIcon(withCheckbox, ticked)}
        {label}
    </div>
);

const EnrichedTreeItem = ({
    label,
    id,
    hasChildren,
    fetchChildrenData, // fetchChildrenData(id)
    expanded,
    // notifyParent,
    toggleOnLabelClick,
    // icon,  //for checkboxes
    onCheckBoxClick, // for checkboxes
    onLabelClick, // this instead for checkboxes
    data, // additional data that can be passed up to the parent (eg org unit details)
    // selected,
    withCheckbox,
    ticked,
}) => {
    // TODO add optional checkbox and checkbox controls
    const isExpanded = expanded.includes(id);
    const isTicked = ticked.includes(id);
    // const [isExpanded, setIsExpanded] = useState(false);
    const { data: childrenData, isLoading } = useAPI(fetchChildrenData, id, {
        preventTrigger: !isExpanded,
    });

    const { formatMessage } = useSafeIntl();

    const handleLabelClick = e => {
        if (!toggleOnLabelClick) {
            e.preventDefault();
        }
        onLabelClick(id);
    };

    // TODO disciminate Icon from chevron
    // eslint-disable-next-line no-unused-vars
    const handleIconClick = e => {
        // e.preventDefault();
        onCheckBoxClick(data);
    };

    const makeSubTree = subTreeData => {
        if (!subTreeData) return null;
        return subTreeData.map(unit => (
            <EnrichedTreeItem
                key={`TreeItem ${unit.id}`}
                label={unit.name || `id: ${unit.id.toString()}`}
                id={unit.id.toString()}
                fetchChildrenData={fetchChildrenData}
                expanded={expanded}
                hasChildren={unit.hasChildren}
                toggleOnLabelClick={toggleOnLabelClick}
                onCheckBoxClick={onCheckBoxClick}
                onLabelClick={onLabelClick}
                data={unit.data ?? null}
                withCheckbox={withCheckbox}
                ticked={ticked}
            />
        ));
    };
    // console.log('isTicked', isTicked, ticked, id);
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
            <div style={{ display: 'flex' }}>
                <TreeItem
                    label={makeLabel(
                        label || `id: ${id.toString()}`,
                        withCheckbox,
                        isTicked,
                    )}
                    nodeId={id}
                    collapseIcon={<ExpandMoreIcon />}
                    expandIcon={<ChevronRightIcon />}
                    onIconClick={handleIconClick}
                    onLabelClick={handleLabelClick}
                >
                    {childrenData && isExpanded && makeSubTree(childrenData)}
                    {!isExpanded && <div />}
                </TreeItem>
            </div>
        );
    }
    // TODO seriously, review this consitional
    return (
        <div style={{ display: 'flex' }}>
            <TreeItem
                label={makeLabel(
                    label || `id: ${id.toString()}`,
                    withCheckbox,
                    isTicked,
                )}
                nodeId={id}
                collapseIcon={<ExpandMoreIcon />}
                expandIcon={<ChevronRightIcon />}
                onIconClick={handleIconClick}
                onLabelClick={handleLabelClick}
            />
        </div>
    );
};

EnrichedTreeItem.propTypes = {
    label: string.isRequired,
    id: string.isRequired,
    // children: oneOfType([element, arrayOf(element)]),
    // should be wrapped in useCallback by parent
    fetchChildrenData: func,
    expanded: arrayOf(string),
    hasChildren: bool,
    // icon: element,
    onCheckBoxClick: func,
    toggleOnLabelClick: bool,
    data: any,
    onLabelClick: func,
    withCheckbox: bool,
    ticked: array,
};

EnrichedTreeItem.defaultProps = {
    // children: null,
    fetchChildrenData: () => {},
    expanded: [],
    hasChildren: false,
    toggleOnLabelClick: true,
    onCheckBoxClick: () => {},
    onLabelClick: () => {},
    data: null,
    withCheckbox: false,
    ticked: [],
};

export { EnrichedTreeItem };
