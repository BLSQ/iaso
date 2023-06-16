import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Box, Grid } from '@material-ui/core';

import {
    commonStyles,
    Table,
    AddButton as AddButtonComponent,
    useSafeIntl,
    selectionInitialState,
    setTableSelection,
    LoadingSpinner,
} from 'bluesquare-components';

import EditIcon from '@material-ui/icons/Settings';
import TopBar from '../../components/nav/TopBarComponent';
import Filters from './components/Filters';
import  { AddUsersDialog } from './components/UsersDialog';

import { baseUrls } from '../../constants/urls';
import { useGetProfiles } from './hooks/useGetProfiles';
import { useDeleteProfile } from './hooks/useDeleteProfile';
import { useSaveProfile } from './hooks/useSaveProfile';

import usersTableColumns from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../routing/actions';
import { useCurrentUser } from '../../utils/usersUtils';
import { BulkImportUsersDialog } from './components/BulkImportDialog/BulkImportDialog';

import { Selection } from '../orgUnits/types/selection';
import { Profile } from '../teams/types/profile';

const baseUrl = baseUrls.users;

type Params = {
    pageSize?: string;
    search?: string;
};

type Props = {
    params: Params;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Users: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

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

    const isLoading = fetchingProfiles || deletingProfile || savingProfile;

    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.users)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {multiActionPopupOpen && 'SHOW MODALE'}
                <Filters baseUrl={baseUrl} params={params} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    {/* @ts-ignore */}
                    <AddUsersDialog
                        titleMessage={MESSAGES.create}
                        saveProfile={saveProfile}
                        allowSendEmailInvitation
                        forceRefresh={isLoading}
                    />
                    <Box ml={2}>
                        {/* @ts-ignore */}
                        <BulkImportUsersDialog />
                    </Box>
                </Grid>
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
                    })}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{
                        pageSize: params.pageSize,
                        search: params.search,
                        refresh: isLoading,
                    }}
                    redirectTo={(b, p) => dispatch(redirectTo(b, p))}
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
