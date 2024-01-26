/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Box, TableCell, TableRow } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import InputComponent from '../../../../../components/forms/InputComponent';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { OrgUnitChangeRequestDetails } from '../../types';

type Props = {
    field: NewOrgUnitField;
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
    isNew: boolean;
    isFetchingChangeRequest: boolean;
    changeRequest?: OrgUnitChangeRequestDetails;
};

const useStyles = makeStyles(theme => ({
    cell: {
        color: 'inherit',
    },
    cellRejected: {
        '& > a': {
            color: `${theme.palette.error.main} !important`,
        },
        '& > span': {
            color: `${theme.palette.error.main} !important`,
        },
        '& > span a': {
            color: `${theme.palette.error.main} !important`,
        },
        '& .marker-custom.primary svg': {
            fill: `${theme.palette.error.main} !important`,
        },
        '& h6': {
            color: `${theme.palette.error.main} !important`,
        },
    },
    cellApproved: {
        '& > a': {
            color: `${theme.palette.success.main} !important`,
        },
        '& > span': {
            color: `${theme.palette.success.main} !important`,
        },
        '& .marker-custom.primary svg': {
            fill: `${theme.palette.success.main} !important`,
        },
        '& h6': {
            color: `${theme.palette.success.main} !important`,
        },
    },
    checkBoxContainer: {
        '& label': {
            margin: 0,
        },
        '& svg': {
            fontSize: 20,
        },
    },
}));

export const ReviewOrgUnitChangesDetailsTableRow: FunctionComponent<Props> = ({
    field,
    setSelected,
    isNew,
    changeRequest,
    isFetchingChangeRequest,
}) => {
    const classes = useStyles();
    const isCellRejected =
        (field.isChanged && !field.isSelected && isNew) ||
        (field.isChanged && changeRequest?.status === 'rejected') ||
        (field.isChanged &&
            changeRequest?.status === 'approved' &&
            !changeRequest.approved_fields.includes(`new_${field.key}`));
    const isCellApproved =
        (field.isChanged && field.isSelected) ||
        (!isNew &&
            changeRequest?.status === 'approved' &&
            changeRequest.approved_fields.includes(`new_${field.key}`));
    return (
        <TableRow key={field.key}>
            <TableCell sx={{ verticalAlign: 'top', width: '5vw' }}>
                {field.label}
            </TableCell>
            <TableCell
                sx={{
                    verticalAlign: 'top',
                }}
            >
                {field.oldValue}
            </TableCell>
            <TableCell
                sx={{
                    verticalAlign: 'top',
                }}
                className={classNames(
                    !isFetchingChangeRequest &&
                        isCellRejected &&
                        classes.cellRejected,
                    !isFetchingChangeRequest &&
                        isCellApproved &&
                        classes.cellApproved,

                    !isCellApproved && !isCellRejected && classes.cell,
                )}
            >
                {field.newValue}
            </TableCell>
            {isNew && (
                <TableCell
                    sx={{
                        padding: 0,
                        width: 30,
                    }}
                >
                    {field.isChanged && (
                        <Box
                            display="flex"
                            justifyContent="center"
                            className={classes.checkBoxContainer}
                        >
                            <InputComponent
                                type="checkbox"
                                withMarginTop={false}
                                value={field.isSelected}
                                keyValue={field.key}
                                onChange={() => {
                                    setSelected(field.key);
                                }}
                                labelString=""
                            />
                        </Box>
                    )}
                </TableCell>
            )}
        </TableRow>
    );
};
