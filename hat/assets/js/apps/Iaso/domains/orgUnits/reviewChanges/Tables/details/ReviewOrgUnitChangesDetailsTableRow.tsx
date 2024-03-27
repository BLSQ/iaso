/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { TableCell } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { OrgUnitChangeRequestDetails } from '../../types';

type Props = {
    field: NewOrgUnitField;
    // eslint-disable-next-line no-unused-vars
    isNew: boolean;
    isNewOrgUnit: boolean;
    isFetchingChangeRequest: boolean;
    changeRequest?: OrgUnitChangeRequestDetails;
};

const useStyles = makeStyles(theme => ({
    cell: {
        color: 'inherit',
    },
    cellRejected: {
        maxWidth: 350,
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
        maxWidth: 350,
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
    verticalTop: {
        verticalAlign: 'top',
    },
    checkBoxCell: {
        padding: 0,
        width: 30,
    },
    labelCell: { verticalAlign: 'top', width: '5vw' },
}));

export const ReviewOrgUnitChangesDetailsTableRow: FunctionComponent<Props> = ({
    field,
    isNew,
    isNewOrgUnit,
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
        <>
            {!isNewOrgUnit && (
                <TableCell className={classes.verticalTop}>
                    {field.oldValue}
                </TableCell>
            )}
            <TableCell
                className={classNames(
                    !isNewOrgUnit &&
                        !isFetchingChangeRequest &&
                        isCellRejected &&
                        classes.cellRejected,
                    !isNewOrgUnit &&
                        !isFetchingChangeRequest &&
                        isCellApproved &&
                        classes.cellApproved,
                    !isCellApproved && !isCellRejected && classes.cell,
                    classes.verticalTop,
                )}
            >
                {field.newValue}
            </TableCell>
        </>
    );
};
