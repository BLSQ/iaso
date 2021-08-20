import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
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
    },
}));
const Head = ({ headerGroups }) => {
    const classes = useStyles();
    return (
        <TableHead>
            {headerGroups.map(headerGroup => {
                const headerGroupProps = headerGroup.getHeaderGroupProps();
                return (
                    <TableRow {...headerGroupProps} key={headerGroupProps.key}>
                        {headerGroup.headers.map(column => {
                            let direction;
                            if (column.isSorted) {
                                if (column.isSortedDesc) {
                                    direction = 'desc';
                                }
                                if (column.isSortedAsc) {
                                    direction = 'asc';
                                }
                            }
                            const columnsProps = column.getHeaderProps(
                                column.isResizing
                                    ? column.getSortByToggleProps()
                                    : undefined,
                            );
                            const cellStyle = {
                                width: column.width ?? 'auto',
                            };
                            return (
                                <TableCell
                                    {...columnsProps}
                                    style={cellStyle}
                                    className={classes.headerCell}
                                    key={columnsProps.key}
                                    align={
                                        column.id === 'actions'
                                            ? 'center'
                                            : 'left'
                                    }
                                >
                                    {column.sortable !== false &&
                                        !column.isResizing && (
                                            <TableSortLabel
                                                active={column.isSorted}
                                                direction={direction}
                                            >
                                                {column.render('Header')}
                                            </TableSortLabel>
                                        )}
                                    {(column.canSort === false ||
                                        column.isResizing) &&
                                        column.render('Header')}
                                    {column.resizable !== false && (
                                        <div
                                            {...column.getResizerProps()}
                                            className={classes.resizer}
                                        />
                                    )}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                );
            })}
        </TableHead>
    );
};
Head.defaultProps = {
    headerGroups: [],
};

Head.propTypes = {
    headerGroups: PropTypes.array,
};

export { Head };
