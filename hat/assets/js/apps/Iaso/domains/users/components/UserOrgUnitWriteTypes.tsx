import React, { FunctionComponent } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box/Box';
import Stack from '@mui/material/Stack/Stack';
import Typography from '@mui/material/Typography/Typography';
import { useSafeIntl, InputWithInfos } from 'bluesquare-components';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import InputComponent from '../../../components/forms/InputComponent';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import MESSAGES from '../messages';
import { UserDialogData } from '../types';

type Props = {
    currentUser: UserDialogData;
    handleChange: (ouTypesIds: number[]) => void;
};

export const UserOrgUnitWriteTypes: FunctionComponent<Props> = ({
    currentUser,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: orgUnitTypes, isLoading: isLoadingOrgUitTypes } =
        useGetOrgUnitTypesDropdownOptions({
            onlyWriteAccess: true,
        });

    const userRolesOrgUnitTypeRestrictions =
        currentUser.user_roles_editable_org_unit_type_ids.value.length > 0;

    return (
        <Box>
            {userRolesOrgUnitTypeRestrictions && (
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                        paddingLeft: '15px',
                        marginRight: '100px',
                        color: theme => theme.palette.warning.main,
                    }}
                >
                    <WarningAmberIcon />
                    <Typography>
                        {formatMessage(
                            MESSAGES.userRoleOrgUnitTypeRestrictionWarning,
                        )}
                    </Typography>
                </Stack>
            )}
            <InputWithInfos
                infos={formatMessage(MESSAGES.orgUnitWriteTypesInfos)}
            >
                <InputComponent
                    multi
                    clearable
                    keyValue="editable_org_unit_type_ids"
                    onChange={(_, value) =>
                        handleChange(commaSeparatedIdsToArray(value))
                    }
                    loading={isLoadingOrgUitTypes}
                    value={currentUser.editable_org_unit_type_ids?.value ?? []}
                    type="select"
                    options={orgUnitTypes}
                    label={MESSAGES.orgUnitWriteTypes}
                    helperText={formatMessage(MESSAGES.selectAllHelperText)}
                />
            </InputWithInfos>
        </Box>
    );
};
