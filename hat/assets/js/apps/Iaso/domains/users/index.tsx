import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    Table,
    useSafeIntl,
    selectionInitialState,
    setTableSelection,
    LoadingSpinner,
    useRedirectTo,
} from 'bluesquare-components';

import EditIcon from '@mui/icons-material/Settings';
import TopBar from '../../components/nav/TopBarComponent';
import Filters from './components/Filters';
import { AddUsersDialog } from './components/UsersDialog';

import { baseUrls } from '../../constants/urls';
import {
    useGetProfilesApiParams,
    useGetProfiles,
} from './hooks/useGetProfiles';
import { useDeleteProfile } from './hooks/useDeleteProfile';
import { useSaveProfile } from './hooks/useSaveProfile';
import { useCreateExportMobileSetup } from './hooks/useCreateExportMobileSetup';

import { usersTableColumns } from './config';
import MESSAGES from './messages';

import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import { BulkImportUsersDialog } from './components/BulkImportDialog/BulkImportDialog';
import { useCurrentUser } from '../../utils/usersUtils';

import { Selection } from '../orgUnits/types/selection';
import { Profile } from '../teams/types/profile';
import { UsersMultiActionsDialog } from './components/UsersMultiActionsDialog';
import { useBulkSaveProfiles } from './hooks/useBulkSaveProfiles';
import { userHasPermission } from './utils';
import * as Permission from '../../utils/permissions';
import { useParamsObject } from '../../routing/hooks/useParamsObject';

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

    const { mutate: saveProfile, isLoading: savingProfile } = useSaveProfile();
    const { mutateAsync: bulkSave, isLoading: savingProfiles } =
        useBulkSaveProfiles();

    const { mutateAsync: exportMobileSetup } = useCreateExportMobileSetup();

    const isLoading =
        fetchingProfiles || deletingProfile || savingProfile || savingProfiles;

    const apiParams = useGetProfilesApiParams(params);

    return (
        <>
            {isLoading && <LoadingSpinner />}
            <UsersMultiActionsDialog
                open={multiActionPopupOpen}
                closeDialog={() => setMultiActionPopupOpen(false)}
                selection={selection}
                setSelection={setSelection}
                saveMulti={(saveData: Record<string, any>) =>
                    bulkSave({ ...saveData, ...params })
                }
            />
            <TopBar
                title={formatMessage(MESSAGES.users)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {multiActionPopupOpen && 'SHOW MODALE'}
                <Filters baseUrl={baseUrl} params={params} />
                {userHasPermission(Permission.USERS_ADMIN, currentUser) && (
                    <Grid
                        container
                        spacing={0}
                        justifyContent="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <AddUsersDialog
                            titleMessage={MESSAGES.create}
                            saveProfile={saveProfile}
                            allowSendEmailInvitation
                            iconProps={{
                                dataTestId: 'add-user-button',
                            }}
                        />
                        <Box ml={2}>
                            {/* @ts-ignore */}
                            <BulkImportUsersDialog />
                        </Box>
                        <DownloadButtonsComponent
                            csvUrl={`${apiParams.url}&csv=true`}
                            xlsxUrl={`${apiParams.url}&xlsx=true`}
                            disabled={isLoading}
                        />
                    </Grid>
                )}
                <Table
                    data={data?.profiles ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'user__username', desc: false }]}
                    columns={usersTableColumns({
                        formatMessage,
                        deleteProfile,
                        params,
                        currentUser,
                        saveProfile,
                        exportMobileSetup,
                    })}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{
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
