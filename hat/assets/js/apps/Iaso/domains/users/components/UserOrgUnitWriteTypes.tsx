import { Box, Stack, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InputComponent from '../../../components/forms/InputComponent';
import { InputWithInfos } from '../../../components/InputWithInfos';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import MESSAGES from '../messages';
import { UserDialogData } from '../types';

type Props = {
    currentUser: UserDialogData;
    handleChange: (ouTypesIds: number[]) => void;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    warningMessage: {
        paddingLeft: '15px',
        marginRight: '100px',
        color: theme.palette.warning.main,
    },
}));

export const UserOrgUnitWriteTypes: FunctionComponent<Props> = ({
    currentUser,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data: orgUnitTypes, isLoading: isLoadingOrgUitTypes } =
        useGetOrgUnitTypesDropdownOptions(undefined, true);

    const userRolesOrgUnitTypeRestrictions =
        currentUser.user_roles_editable_org_unit_type_ids.value.length > 0;

    return (
        <Box>
            {userRolesOrgUnitTypeRestrictions && (
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    className={classes.warningMessage}
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
