import React from 'react';
import PropTypes from 'prop-types';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import { HeadCell } from './HeadCell';

const Head = ({ headerGroups }) => {
    return (
        <TableHead>
            {headerGroups.map(headerGroup => {
                const headerGroupProps = headerGroup.getHeaderGroupProps();
                return (
                    <TableRow {...headerGroupProps} key={headerGroupProps.key}>
                        {headerGroup.headers.map(column => (
                            <HeadCell column={column} key={column.id} />
                        ))}
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
