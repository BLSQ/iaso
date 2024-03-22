import React, { FunctionComponent } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { NewOrgUnitField } from '../hooks/useNewFields';
import MESSAGES from '../messages';
import { Accordion } from '../../../../components/Accordion/Accordion';
import { AccordionSummary } from '../../../../components/Accordion/AccordionSummary';
import { AccordionDetails } from '../../../../components/Accordion/AccordionDetails';

type Props = {
    fieldValues: any[];
    status: string;
    field: NewOrgUnitField;
};

export const ReviewOrgUnitFieldChanges: FunctionComponent<Props> = ({
    fieldValues,
    status,
    field,
}) => {
    const { formatMessage } = useSafeIntl();
    const isCellApproved =
        (status && status === 'approved' && 'success.light') || '';
    const isSelected =
        (status && field?.isSelected === true && 'success.light') || '';

    return (
        <Accordion>
            <AccordionSummary
                aria-controls="change-request"
                id="change-request"
            >
                {formatMessage(MESSAGES.viewDetails)}
            </AccordionSummary>
            <AccordionDetails>
                <Table size="small">
                    <TableBody>
                        {fieldValues.map(value => {
                            const { name } = value;
                            const isHighlighted =
                                (((value.left === false &&
                                    value.right === true) ||
                                    (value.left === true &&
                                        value.right === false)) &&
                                    'error.light') ||
                                '';
                            return (
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            borderBottom: 'none',
                                            color: isHighlighted,
                                        }}
                                    >
                                        {(value.left === true && name) || ''}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            borderBottom: 'none',
                                            color:
                                                isCellApproved ||
                                                isSelected ||
                                                isHighlighted,
                                        }}
                                    >
                                        {(value.right === true && name) || ''}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    );
};
