import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';
import EditIcon from '@mui/icons-material/Settings';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    useSafeIntl,
    selectionInitialState,
    setTableSelection,
    useRedirectTo,
} from 'bluesquare-components';

import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { CreateUserDialog } from 'Iaso/domains/users/components/CreateUserDialog';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import * as Permission from '../../utils/permissions';
import { Selection } from '../orgUnits/types/selection';
import { Profile } from '../teams/types/profile';
import { BulkImportUsersDialog } from './components/BulkImportDialog/BulkImportDialog';
import Filters from './components/Filters';

import { UsersMultiActionsDialog } from './components/UsersMultiActionsDialog';
import { useUsersTableColumns } from './config';
import { useBulkSaveProfiles } from './hooks/useBulkSaveProfiles';
import { useCreateExportMobileSetup } from './hooks/useCreateExportMobileSetup';
import { useCreateProfile } from './hooks/useCreateProfile';
import { useDeleteProfile } from './hooks/useDeleteProfile';
import {
    useGetProfilesApiParams,
    useGetProfiles,
} from './hooks/useGetProfiles';
import { useSaveProfile } from './hooks/useSaveProfile';

import MESSAGES from './messages';

import { userHasPermission } from './utils';

const baseUrl = baseUrls.users;

type Params = {
    pageSize?: string;
    search?: string;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Users: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.users) as unknown as Params;
    const classes: Record<string, string> = useStyles();
    const currentUser = useCurrentUser();
    const canBypassProjectRestrictions = userHasPermission(
        Permission.USERS_ADMIN,
        currentUser,
    );
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();

    const [multiActionPopupOpen, setMultiActionPopupOpen] =
        useState<boolean>(false);
    const [selection, setSelection] = useState<Selection<Profile>>(
        selectionInitialState,
    );
    const multiEditDisabled =
        !selection.selectAll && selection.selectedItems.length === 0;
    const handleTableSelection = useCallback(
        (selectionType, items = [], totalCount = 0) => {
            const newSelection: Selection<Profile> = setTableSelection(
                selection,
                selectionType,
                items,
                totalCount,
            );
            setSelection(newSelection);
        },
        [selection],
    );
    const selectionActions = useMemo(
        () => [
            {
                icon: <EditIcon />,
                label: formatMessage(MESSAGES.multiSelectionAction),
                onClick: () => setMultiActionPopupOpen(true),
                disabled: multiEditDisabled,
            },
        ],
        [formatMessage, multiEditDisabled, setMultiActionPopupOpen],
    );
    const { data, isFetching: fetchingProfiles } = useGetProfiles(params);

    const { mutate: deleteProfile, isLoading: deletingProfile } =
        useDeleteProfile();

    const { mutate: createProfile, isLoading: creatingProfile } =
        useCreateProfile();
    const { mutate: saveProfile, isLoading: savingProfile } = useSaveProfile();
    const { mutateAsync: bulkSave, isLoading: savingProfiles } =
        useBulkSaveProfiles();

    const { mutateAsync: exportMobileSetup } = useCreateExportMobileSetup();

    const isLoading =
        fetchingProfiles ||
        deletingProfile ||
        creatingProfile ||
        savingProfile ||
        savingProfiles;

    const apiParams = useGetProfilesApiParams(params);
    const columns = useUsersTableColumns({
        deleteProfile,
        params,
        currentUser,
        saveProfile,
        exportMobileSetup,
        canBypassProjectRestrictions,
    });

    const exportCsvURL = makeUrlWithParams(`/api/profiles/export-csv/`, {
        ...apiParams?.apiParams,
        managedUsersOnly: apiParams?.apiParams?.managedUsersOnly ?? 'true',
    });

    const exportXlsxURL = makeUrlWithParams(`/api/profiles/export-xlsx/`, {
        ...apiParams?.apiParams,
        managedUsersOnly: apiParams?.apiParams?.managedUsersOnly ?? 'true',
    });

    return (
        <>
            <UsersMultiActionsDialog
                open={multiActionPopupOpen}
                closeDialog={() => setMultiActionPopupOpen(false)}
                selection={selection}
                setSelection={setSelection}
                saveMulti={(saveData: Record<string, any>) =>
                    bulkSave({ ...saveData, ...params })
                }
                canBypassProjectRestrictions={canBypassProjectRestrictions}
            />
            <TopBar title={formatMessage(MESSAGES.users)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    baseUrl={baseUrl}
                    params={params}
                    canBypassProjectRestrictions={canBypassProjectRestrictions}
                />
                <DisplayIfUserHasPerm
                    permissions={[
                        Permission.USERS_ADMIN,
                        Permission.USERS_MANAGEMENT,
                    ]}
                >
                    <Grid
                        container
                        spacing={0}
                        justifyContent="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <CreateUserDialog
                            titleMessage={MESSAGES.create}
                            createProfile={createProfile}
                            allowSendEmailInvitation
                            iconProps={{
                                dataTestId: 'add-user-button',
                            }}
                            canBypassProjectRestrictions={
                                canBypassProjectRestrictions
                            }
                        />
                        <Box ml={2}>
                            {/* @ts-ignore */}
                            <BulkImportUsersDialog />
                        </Box>
                        <DownloadButtonsComponent
                            csvUrl={exportCsvURL}
                            xlsxUrl={exportXlsxURL}
                            disabled={isLoading}
                        />
                    </Grid>
                </DisplayIfUserHasPerm>
                <TableWithDeepLink
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'user__username', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{
                        loading: isLoading,
                        pageSize: params.pageSize,
                        search: params.search,
                    }}
                    redirectTo={(b, p) => redirectTo(b, p)}
                    multiSelect
                    selection={selection}
                    selectionActions={selectionActions}
                    //  @ts-ignore
                    setTableSelection={(selectionType, items, totalCount) =>
                        handleTableSelection(selectionType, items, totalCount)
                    }
                />
            </Box>
        </>
    );
};
