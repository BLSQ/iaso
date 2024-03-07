import React, { FunctionComponent } from 'react';
import { differenceBy } from 'lodash';
import { Box, TableCell, TableRow } from '@mui/material';
import { NestedGroup } from '../types';
import { ReviewOrgUnitGroupChanges } from './ReviewOrgUnitGroupChanges';
import { NewOrgUnitField } from '../hooks/useNewFields';
import InputComponent from '../../../../components/forms/InputComponent';

type Props = {
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
    field: NewOrgUnitField;
    label: string;
    newGroups: NestedGroup[];
    oldGroups: NestedGroup[];
    status: string;
    isNew: boolean;
};

export const HighlightFields: FunctionComponent<Props> = ({
    field,
    label,
    newGroups,
    oldGroups,
    isNew,
    setSelected,
    status,
}) => {
    const newAddedGroups = differenceBy(newGroups, oldGroups, 'id');
    return (
        <TableRow>
            <TableCell>{label}</TableCell>
            <TableCell>
                <ReviewOrgUnitGroupChanges
                    groups={oldGroups}
                    newAddedGroups={[]}
                    status={undefined}
                    field={field}
                />
            </TableCell>
            <TableCell>
                <ReviewOrgUnitGroupChanges
                    groups={newGroups}
                    newAddedGroups={newAddedGroups}
                    status={status}
                    field={field}
                />
            </TableCell>
            {isNew && (
                <TableCell>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            '& label': { margin: 0 },
                            '& svg': { fontSize: 20 },
                        }}
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
                </TableCell>
            )}
        </TableRow>
    );
};
