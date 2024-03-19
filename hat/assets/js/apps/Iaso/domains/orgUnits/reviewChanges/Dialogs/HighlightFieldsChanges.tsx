import React, { FunctionComponent } from 'react';
import { differenceBy, sortBy } from 'lodash';
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
    status,
    fieldType,
    isFetchingChangeRequest,
    changeRequest,
}) => {
    let newAddedFieldValues: NestedGroup[] = [];
    let changedFieldWithNewValues: NestedGroup[] = [];
    let changedFieldWithOldValues: NestedGroup[] = [];

    if (fieldType && fieldType === 'array') {
        changedFieldWithNewValues = sortBy(newFieldValues, 'id');
        changedFieldWithOldValues = sortBy(oldFieldValues, 'id');
        newAddedFieldValues = differenceBy(
            changedFieldWithNewValues,
            changedFieldWithOldValues,
            'id',
        );
    }

    return (
        <TableRow>
            <TableCell>{field.label}</TableCell>
            {(fieldType && fieldType === 'array' && (
                <>
                    <TableCell>
                        {(changedFieldWithOldValues?.length > 0 && (
                            <ReviewOrgUnitFieldChanges
                                fieldValues={changedFieldWithOldValues}
                                newAddedFieldValues={[]}
                                status={undefined}
                                field={field}
                            />
                        )) ||
                            '--'}
                    </TableCell>
                    <TableCell>
                        {(changedFieldWithNewValues?.length > 0 && (
                            <ReviewOrgUnitFieldChanges
                                fieldValues={changedFieldWithNewValues}
                                newAddedFieldValues={newAddedFieldValues}
                                status={status}
                                field={field}
                            />
                        )) ||
                            '--'}
                    </TableCell>
                </>
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
