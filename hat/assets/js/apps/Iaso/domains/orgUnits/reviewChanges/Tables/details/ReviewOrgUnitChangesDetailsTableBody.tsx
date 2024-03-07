import React, { FunctionComponent } from 'react';
import { TableBody } from '@mui/material';
import { sortBy } from 'lodash';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { ReviewOrgUnitChangesDetailsTableRow } from './ReviewOrgUnitChangesDetailsTableRow';
import { OrgUnitChangeRequestDetails } from '../../types';
import { HighlightFields } from '../../Dialogs/HighlightFieldsChanges';

type Props = {
    newFields: NewOrgUnitField[];
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
    isFetchingChangeRequest: boolean;
    changeRequest?: OrgUnitChangeRequestDetails;
    isNew: boolean;
    isNewOrgUnit: boolean;
};

export const ReviewOrgUnitChangesDetailsTableBody: FunctionComponent<Props> = ({
    newFields,
    setSelected,
    isFetchingChangeRequest,
    changeRequest,
    isNew,
    isNewOrgUnit,
}) => {
    return (
        <TableBody>
            {newFields.map(field => {
                if (field.key === 'groups') {
                    const changedFieldWithNewValues =
                        changeRequest && changeRequest[`new_${field.key}`];
                    const changedFieldWithOldValues =
                        changeRequest && changeRequest[`old_${field.key}`];

                    return (
                        <HighlightFields
                            label={field.label}
                            field={field}
                            newGroups={sortBy(changedFieldWithNewValues, 'id')}
                            oldGroups={sortBy(changedFieldWithOldValues, 'id')}
                            status={changeRequest?.status || ''}
                            isNew={isNew}
                            setSelected={setSelected}
                        />
                    );
                }
                return (
                    <ReviewOrgUnitChangesDetailsTableRow
                        key={field.key}
                        field={field}
                        setSelected={setSelected}
                        isNew={isNew}
                        isNewOrgUnit={isNewOrgUnit}
                        changeRequest={changeRequest}
                        isFetchingChangeRequest={isFetchingChangeRequest}
                    />
                );
            })}
        </TableBody>
    );
};
