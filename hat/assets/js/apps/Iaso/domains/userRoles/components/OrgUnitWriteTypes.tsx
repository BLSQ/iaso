import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../components/forms/InputComponent';
import { InputWithInfos } from '../../../components/InputWithInfos';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { SaveUserRoleQuery } from '../hooks/requests/useSaveUserRole';
import MESSAGES from '../messages';
import { useCurrentUser } from '../../../utils/usersUtils';
import * as Permissions from '../../../utils/permissions';
import { userHasPermission } from '../../users/utils';

type Props = {
    userRole: Partial<SaveUserRoleQuery>;
    handleChange: (ouTypesIds: number[]) => void;
};

export const OrgUnitWriteTypes: FunctionComponent<Props> = ({
    userRole,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: orgUnitTypes, isLoading: isLoadingOrgUitTypes } =
        useGetOrgUnitTypesDropdownOptions(undefined, true);

    const currentUser = useCurrentUser();
    const hasNoOrgUnitManagementWrite = !userHasPermission(
        Permissions.ORG_UNITS,
        currentUser,
    );
    return (
        <Box>
            <InputWithInfos
                infos={
                    hasNoOrgUnitManagementWrite
                        ? formatMessage(
                              MESSAGES.OrgUnitTypeWriteDisableTooltip,
                              { type: formatMessage(MESSAGES.userRole) },
                          )
                        : formatMessage(MESSAGES.orgUnitWriteTypesInfos)
                }
            >
                <InputComponent
                    multi
                    clearable
                    keyValue="editable_org_unit_type_ids"
                    onChange={(_, value) =>
                        handleChange(commaSeparatedIdsToArray(value))
                    }
                    loading={isLoadingOrgUitTypes}
                    value={userRole.editable_org_unit_type_ids ?? []}
                    type="select"
                    options={orgUnitTypes}
                    label={MESSAGES.orgUnitWriteTypes}
                    helperText={
                        hasNoOrgUnitManagementWrite
                            ? ''
                            : formatMessage(MESSAGES.selectAllHelperText)
                    }
                    disabled={hasNoOrgUnitManagementWrite}
                />
            </InputWithInfos>
        </Box>
    );
};
