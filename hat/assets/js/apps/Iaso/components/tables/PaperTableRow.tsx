import { TableCell, TableRow } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner } from 'bluesquare-components';
import classNames from 'classnames';
import React, { FunctionComponent } from 'react';

const useStyles = makeStyles(theme => ({
    withBorder: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
    },
    boldTitle: {
        fontWeight: 'bold',
    },
}));

type RowProps = {
    label?: string;
    value?: string | number;
    isLoading?: boolean;
    withLeftCellBorder?: boolean;
    boldLeftCellText?: boolean;
    className?: string;
};

export const PaperTableRow: FunctionComponent<RowProps> = ({
    label,
    value,
    isLoading = false,
    withLeftCellBorder = true,
    boldLeftCellText = true,
    className,
}) => {
    const classes = useStyles();
    const borderClass = withLeftCellBorder ? classes.withBorder : '';
    const boldTitle = boldLeftCellText ? classes.boldTitle : '';
    return (
        <TableRow className={className}>
            <TableCell className={classNames(borderClass, boldTitle)}>
                {label}
            </TableCell>
            <TableCell>
                {isLoading && (
                    <LoadingSpinner
                        fixed={false}
                        transparent
                        padding={4}
                        size={25}
                    />
                )}
                {!isLoading && value}
            </TableCell>
        </TableRow>
    );
};
