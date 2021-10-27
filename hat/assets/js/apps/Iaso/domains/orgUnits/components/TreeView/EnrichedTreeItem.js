import React, { useCallback, useRef, useEffect } from 'react';
import { string, func, arrayOf, bool, any, array, oneOfType } from 'prop-types';
import { TreeItem } from '@material-ui/lab';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CheckBoxOutlineBlankOutlinedIcon from '@material-ui/icons/CheckBoxOutlineBlankOutlined';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import { makeStyles } from '@material-ui/core/styles';
import { useChildrenData } from './requests';

const styles = theme => ({
    treeItem: {
        '&.MuiTreeItem-root.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label':
            {
                backgroundColor: theme.palette.primary.background,
                alignItems: 'center',
            },
    },
    checkbox: {
        color: theme.palette.mediumGray.main,
        fontSize: '16px',
        marginRight: '5px',
    },
});

const useStyles = makeStyles(styles);

const EnrichedTreeItem = ({
    label,
    id,
    hasChildren,
    fetchChildrenData, // fetchChildrenData(id)
    expanded,
    toggleOnLabelClick,
    onLabelClick,
    data, // additional data that can be passed up to the parent (eg org unit details)
    withCheckbox,
    ticked,
    parentsTicked,
    scrollIntoView,
    tailIcon,
}) => {
    const classes = useStyles();
    const isExpanded = expanded.includes(id);
    const isTicked = ticked.includes(id);
    const isTickedParent = parentsTicked.includes(id);
    const { data: childrenData, isLoading } = useChildrenData(
        fetchChildrenData,
        id,
        isExpanded,
    );
    const ref = useRef();

    const makeIcon = (hasCheckbox, hasBeenTicked, tickedParent) => {
        if (!hasCheckbox) return null;
        if (hasBeenTicked) return <CheckBoxIcon className={classes.checkbox} />;
        if (tickedParent)
            return <IndeterminateCheckBoxIcon className={classes.checkbox} />;
        return (
            <CheckBoxOutlineBlankOutlinedIcon className={classes.checkbox} />
        );
    };

    const makeLabel = (child, hasCheckbox, hasBeenTicked, tickedParent) => (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle',
            }}
        >
            {makeIcon(hasCheckbox, hasBeenTicked, tickedParent)}
            {child}
            {data && tailIcon(data)}
        </div>
    );

    const handleLabelClick = useCallback(
        e => {
            if (!toggleOnLabelClick) {
                e.preventDefault();
            }
            onLabelClick(id, data);
        },
        [data, id, onLabelClick, toggleOnLabelClick],
    );

    useEffect(() => {
        if (scrollIntoView === id) {
            ref.current.scrollIntoView();
        }
    }, [scrollIntoView, id, ref]);

    const makeSubTree = subTreeData => {
        if (!subTreeData) return null;
        return subTreeData.map(unit => {
            return (
                <EnrichedTreeItem
                    key={`TreeItem ${unit.id}`}
                    label={unit.name || `id: ${unit.id.toString()}`}
                    id={unit.id.toString()}
                    fetchChildrenData={fetchChildrenData}
                    expanded={expanded}
                    hasChildren={unit.hasChildren}
                    toggleOnLabelClick={toggleOnLabelClick}
                    onLabelClick={onLabelClick}
                    data={unit.data ?? null}
                    withCheckbox={withCheckbox}
                    ticked={ticked}
                    parentsTicked={parentsTicked}
                    scrollIntoView={scrollIntoView}
                    tailIcon={tailIcon}
                />
            );
        });
    };
    if (isExpanded && isLoading) {
        return (
            <TreeItem
                classes={{ root: classes.treeItem }}
                ref={ref}
                label={makeLabel(
                    label || `id: ${id.toString()}`,
                    withCheckbox,
                    isTicked,
                    isTickedParent,
                )}
                nodeId={id}
                icon={<ArrowDropDownIcon style={{ fontSize: 'large' }} />}
            />
        );
    }
    if (hasChildren) {
        return (
            <div style={{ display: 'flex' }}>
                <TreeItem
                    classes={{ root: classes.treeItem }}
                    ref={ref}
                    label={makeLabel(
                        label || `id: ${id.toString()}`,
                        withCheckbox,
                        isTicked,
                        isTickedParent,
                    )}
                    nodeId={id}
                    collapseIcon={
                        <ArrowDropDownIcon style={{ fontSize: '24px' }} />
                    }
                    expandIcon={<ArrowRightIcon style={{ fontSize: '24px' }} />}
                    onLabelClick={handleLabelClick}
                >
                    {childrenData && isExpanded && makeSubTree(childrenData)}
                    {!isExpanded && <div />}
                </TreeItem>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex' }}>
            <TreeItem
                classes={{ root: classes.treeItem }}
                ref={ref}
                label={makeLabel(
                    label || `id: ${id.toString()}`,
                    withCheckbox,
                    isTicked,
                )}
                nodeId={id}
                collapseIcon={
                    <ArrowDropDownIcon style={{ fontSize: '24px' }} />
                }
                expandIcon={<ArrowRightIcon style={{ fontSize: '24px' }} />}
                onLabelClick={handleLabelClick}
            />
        </div>
    );
};

EnrichedTreeItem.propTypes = {
    label: string.isRequired,
    id: string.isRequired,
    // should be wrapped in useCallback by parent
    fetchChildrenData: func,
    expanded: arrayOf(string),
    hasChildren: bool,
    toggleOnLabelClick: bool,
    data: any,
    onLabelClick: func,
    withCheckbox: bool,
    ticked: oneOfType([string, array]),
    parentsTicked: array,
    scrollIntoView: string,
    tailIcon: func,
};

EnrichedTreeItem.defaultProps = {
    fetchChildrenData: () => {},
    expanded: [],
    hasChildren: false,
    toggleOnLabelClick: true,
    onLabelClick: () => {},
    data: null,
    withCheckbox: false,
    ticked: [],
    parentsTicked: [],
    scrollIntoView: null,
    tailIcon: () => null,
};

export { EnrichedTreeItem };
