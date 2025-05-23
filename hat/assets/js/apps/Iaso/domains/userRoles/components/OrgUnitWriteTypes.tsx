import React, { FunctionComponent, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { InputWithInfos, useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import * as Permissions from '../../../utils/permissions';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { SaveUserRoleQuery } from '../hooks/requests/useSaveUserRole';
import MESSAGES from '../messages';
import { Permission } from '../types/userRoles';

type Props = {
    userRole: Partial<SaveUserRoleQuery>;
    handleChange: (ouTypesIds: number[]) => void;
    userRolePermissions: Permission[];
};

export const OrgUnitWriteTypes: FunctionComponent<Props> = ({
    userRole,
    handleChange,
    userRolePermissions,
}) => {
    const { formatMessage } = useSafeIntl();
    const [hasNoOrgUnitManagementWrite, setHasNoOrgUnitManagementWrite] =
        useState<boolean>(
            !userRolePermissions.includes(
                Permissions.ORG_UNITS as unknown as Permission,
            ),
        );
    const { data: orgUnitTypes, isLoading: isLoadingOrgUitTypes } =
        useGetOrgUnitTypesDropdownOptions({
            onlyWriteAccess: true,
        });

    useEffect(() => {
        setHasNoOrgUnitManagementWrite(
            !userRolePermissions.includes(
                Permissions.ORG_UNITS as unknown as Permission,
            ),
        );
    }, [userRolePermissions]);

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
