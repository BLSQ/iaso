import React, { FunctionComponent } from 'react';
import { some, uniqBy, sortBy } from 'lodash';
import { Box, TableCell, TableRow } from '@mui/material';
import { NestedGroup, OrgUnitChangeRequestDetails } from '../types';
import { ReviewOrgUnitFieldChanges } from './ReviewOrgUnitFieldChanges';
import { NewOrgUnitField } from '../hooks/useNewFields';
import InputComponent from '../../../../components/forms/InputComponent';
import { ReviewOrgUnitChangesDetailsTableRow } from '../Tables/details/ReviewOrgUnitChangesDetailsTableRow';

type Props = {
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
    field: NewOrgUnitField;
    newFieldValues: NestedGroup[];
    oldFieldValues: NestedGroup[];
    status: string;
    isNew: boolean;
    isNewOrgUnit: boolean;
    fieldType: string;
    isFetchingChangeRequest: boolean;
    changeRequest?: OrgUnitChangeRequestDetails;
};

export const HighlightFields: FunctionComponent<Props> = ({
    field,
    newFieldValues,
    oldFieldValues,
    isNew,
    isNewOrgUnit,
    setSelected,
    fieldType,
    isFetchingChangeRequest,
    changeRequest,
}) => {
    let changedFieldWithNewValues: NestedGroup[] = [];
    let changedFieldWithOldValues: NestedGroup[] = [];

    let allLeftAndRightFields: NestedGroup[] = [];
    let changedFieldValues: NestedGroup[] = [];

    if (fieldType && fieldType === 'array') {
        allLeftAndRightFields = [];
        changedFieldWithOldValues = sortBy(oldFieldValues, 'name');
        changedFieldWithNewValues = sortBy(newFieldValues, 'name');
    }
    changedFieldValues = uniqBy(
        changedFieldWithOldValues.concat(changedFieldWithNewValues),
        'id',
    );

    allLeftAndRightFields = changedFieldValues.map(row => {
        let left = false;
        let right = false;
        if (some(changedFieldWithNewValues, item => item.id === row.id)) {
            right = true;
        }
        if (some(changedFieldWithOldValues, item => item.id === row.id)) {
            left = true;
        }
        return {
            ...row,
            left,
            right,
        };
    });

    return (
        <TableRow>
            <TableCell>{field.label}</TableCell>
            {(fieldType && fieldType === 'array' && (
                <TableCell colSpan={2}>
                    {(allLeftAndRightFields?.length > 0 && (
                        <ReviewOrgUnitFieldChanges
                            fieldValues={allLeftAndRightFields}
                            field={field}
                            status={changeRequest?.status || ''}
                        />
                    )) ||
                        '--'}
                </TableCell>
            )) || (
                <ReviewOrgUnitChangesDetailsTableRow
                    key={field.key}
                    field={field}
                    isNew={isNew}
                    isNewOrgUnit={isNewOrgUnit}
                    changeRequest={changeRequest}
                    isFetchingChangeRequest={isFetchingChangeRequest}
                />
            )}
            {isNew && !isNewOrgUnit && (
                <TableCell>
                    {field.isChanged && (
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
                    )}
                </TableCell>
            )}
        </TableRow>
    );
};
