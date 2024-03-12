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
    groups: NestedGroup[];
    newAddedGroups: NestedGroup[];
    status: string | undefined;
    field: NewOrgUnitField;
};

export const ReviewOrgUnitGroupChanges: FunctionComponent<Props> = ({
    groups,
    newAddedGroups,
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
                <Table>
                    <TableBody>
                        {groups.map(group => {
                            const { name } = group;
                            const isNewElement =
                                newAddedGroups?.includes(group);
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
