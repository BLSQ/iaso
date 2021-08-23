import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableSortLabel from '@material-ui/core/TableSortLabel';

const useStyles = makeStyles(theme => ({
    resizer: {
        display: 'inline-block',
        width: '15px',
        height: '100%',
        position: 'absolute',
        right: 0,
        top: 0,
        transform: 'translateX(50%)',
        zIndex: 1,
        touchAction: 'none',
        cursor: 'col-resize',
    },
    headerCell: {
        borderRight: `2px solid ${theme.palette.ligthGray.border}`,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        backgroundColor: 'white',
    },
    sortLabel: {
        display: 'inline-block',
        width: '80%',
    },
    icon: {
        color: `${theme.palette.primary.main}!important`,
        position: 'absolute',
        left: '100%',
        top: 3,
    },
}));
const HeadCell = ({ column }) => {
    const classes = useStyles();
    const [columnsProps, setColumnsProps] = useState(
        column.getHeaderProps(
            column.sortable !== false
                ? column.getSortByToggleProps()
                : undefined,
        ),
    );
    let direction;
    if (column.isSorted) {
        if (column.isSortedDesc) {
            direction = 'desc';
        }
        if (column.isSortedAsc) {
            direction = 'asc';
        }
    }

    useEffect(() => {
        if (!column.isResizing && column.sortable !== false) {
            // prevent resize click to sort column...
            setTimeout(() => {
                setColumnsProps(
                    column.getHeaderProps(column.getSortByToggleProps()),
                );
            }, 500);
        } else {
            setColumnsProps(column.getHeaderProps());
        }
    }, [column.isResizing]);

    const cellStyle = {
        width: column.width ?? 'auto',
    };
    return (
        <TableCell
            {...columnsProps}
            style={cellStyle}
            className={classes.headerCell}
            key={columnsProps.key}
        >
            {column.sortable !== false && !column.isResizing && (
                <TableSortLabel
                    active={column.isSorted}
                    direction={direction}
                    classes={{
                        root: classes.sortLabel,
                        icon: classes.icon,
                    }}
                >
                    {column.render('Header')}
                </TableSortLabel>
            )}
            {(column.sortable === false || column.isResizing) &&
                column.render('Header')}
            {column.resizable !== false && (
                <div
                    {...column.getResizerProps()}
                    className={classes.resizer}
                />
            )}
        </TableCell>
    );
};

HeadCell.propTypes = {
    column: PropTypes.object.isRequired,
};

export { HeadCell };
