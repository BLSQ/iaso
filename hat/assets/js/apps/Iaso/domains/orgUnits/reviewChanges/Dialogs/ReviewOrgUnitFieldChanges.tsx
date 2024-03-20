import React, { FunctionComponent } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { NestedGroup } from '../types';
import { NewOrgUnitField } from '../hooks/useNewFields';
import MESSAGES from '../messages';
import { Accordion } from '../../../../components/Accordion/Accordion';
import { AccordionSummary } from '../../../../components/Accordion/AccordionSummary';
import { AccordionDetails } from '../../../../components/Accordion/AccordionDetails';

type Props = {
    fieldValues: NestedGroup[];
    newAddedFieldValues: NestedGroup[];
    status: string | undefined;
    field: NewOrgUnitField;
};

export const ReviewOrgUnitFieldChanges: FunctionComponent<Props> = ({
    fieldValues,
    newAddedFieldValues,
    status,
    field,
}) => {
    const isCellApproved =
        (status && status === 'approved' && 'success.light') || '';
    const isSelected =
        (status && field?.isSelected === true && 'success.light') || '';
    const { formatMessage } = useSafeIntl();

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
                        {fieldValues?.map(group => {
                            const { name } = group;
                            const isNewElement =
                                newAddedFieldValues?.includes(group);
                            const selected = isSelected;
                            return (
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            color:
                                                (selected !== '' && selected) ||
                                                (isNewElement &&
                                                    'error.light') ||
                                                isCellApproved,
                                            borderBottom: 'none',
                                        }}
                                    >
                                        {name}
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
