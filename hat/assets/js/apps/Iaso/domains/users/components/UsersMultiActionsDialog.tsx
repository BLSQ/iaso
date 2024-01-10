import React, {
    FunctionComponent,
    useCallback,
    useState,
    Dispatch,
    SetStateAction,
} from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    formatThousand,
    useSafeIntl,
    selectionInitialState,
} from 'bluesquare-components';
import ReportIcon from '@mui/icons-material/Report';
import { UseMutateAsyncFunction } from 'react-query';

import { isEqual } from 'lodash';
import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';

import { APP_LOCALES } from '../../app/constants';

import { Selection } from '../../orgUnits/types/selection';
import { Profile } from '../../teams/types/profile';

import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { useGetUserRolesOptions } from '../../userRoles/hooks/requests/useGetUserRoles';
import { userHasPermission } from '../utils';
import { useCurrentUser } from '../../../utils/usersUtils';
import * as Permission from '../../../utils/permissions';

type Props = {
    open: boolean;
    closeDialog: () => void;
    selection: Selection<Profile>;
    setSelection: Dispatch<SetStateAction<Selection<Profile>>>;
    saveMulti: UseMutateAsyncFunction<unknown, unknown, unknown, unknown>;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'visible',
    },
    title: {
        paddingBottom: 0,
    },
    content: {
        overflow: 'visible',
        paddingBottom: theme.spacing(2),
    },
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    warningTitle: {
        display: 'flex',
        alignItems: 'center',
    },
    warningIcon: {
        display: 'inline-block',
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    warningMessage: {
        display: 'flex',
        justifyContent: 'center',
    },
}));

type BulkState = {
    addRoles: string[];
    removeRoles: string[];
    addProjects: string[];
    removeProjects: string[];
    language?: 'en' | 'fr';
    addLocations: OrgUnit[];
    removeLocations: OrgUnit[];
};

const initialState: BulkState = {
    addRoles: [],
    removeRoles: [],
    addProjects: [],
    removeProjects: [],
    language: undefined,
    addLocations: [],
    removeLocations: [],
};

export const UsersMultiActionsDialog: FunctionComponent<Props> = ({
    open,
    closeDialog,
    selection,
    setSelection,
    saveMulti,
}) => {
    const currentUser = useCurrentUser();
    const [bulkState, setBulkState] = useState<BulkState>(initialState);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const { data: userRoles, isFetching: isFetchingUserRoles } =
        useGetUserRolesOptions();
    const handleChange = useCallback(
        (key, value) => {
            setBulkState({
                ...bulkState,
                [key]: value || initialState[key],
            });
        },
        [bulkState],
    );
    const closeAndReset = () => {
        closeDialog();
        setBulkState(initialState);
        setSelection(selectionInitialState);
    };
    const saveAndReset = () => {
        saveMulti({ ...bulkState, selection }).then(() => closeAndReset());
    };
    return (
        <Dialog
            fullWidth
            maxWidth="xs"
            open={open}
            classes={{
                paper: classes.paper,
            }}
            onClose={(_, reason) => {
                if (reason === 'backdropClick') {
                    closeAndReset();
                }
            }}
            scroll="body"
        >
            <DialogTitle className={classes.title}>
                {formatMessage(MESSAGES.multiEditTitle, {
                    count: formatThousand(selection.selectCount),
                })}
            </DialogTitle>
            <DialogContent className={classes.content}>
                <InputComponent
                    keyValue="addRoles"
                    onChange={(key, value) =>
                        handleChange(key, value ? value.split(',') : value)
                    }
                    value={bulkState.addRoles}
                    type="select"
                    multi
                    label={MESSAGES.addRoles}
                    options={userRoles}
                    loading={isFetchingUserRoles}
                />
                <InputComponent
                    keyValue="removeRoles"
                    onChange={(key, value) =>
                        handleChange(key, value ? value.split(',') : value)
                    }
                    value={bulkState.removeRoles}
                    type="select"
                    multi
                    label={MESSAGES.removeRoles}
                    options={userRoles}
                    loading={isFetchingUserRoles}
                />
                {userHasPermission(Permission.USERS_ADMIN, currentUser) && (
                    <>
                        <InputComponent
                            keyValue="addProjects"
                            onChange={(key, value) =>
                                handleChange(
                                    key,
                                    value ? value.split(',') : value,
                                )
                            }
                            value={bulkState.addProjects}
                            type="select"
                            multi
                            label={MESSAGES.addProjects}
                            options={allProjects}
                            loading={isFetchingProjects}
                        />
                        <InputComponent
                            keyValue="removeProjects"
                            onChange={(key, value) =>
                                handleChange(
                                    key,
                                    value ? value.split(',') : value,
                                )
                            }
                            value={bulkState.removeProjects}
                            type="select"
                            multi
                            label={MESSAGES.removeProjects}
                            options={allProjects}
                            loading={isFetchingProjects}
                        />
                    </>
                )}
                <InputComponent
                    keyValue="language"
                    onChange={handleChange}
                    value={bulkState.language}
                    type="select"
                    multi={false}
                    label={MESSAGES.locale}
                    options={APP_LOCALES.map(locale => {
                        return {
                            value: locale.code,
                            label: locale.label,
                        };
                    })}
                />
                <OrgUnitTreeviewModal
                    toggleOnLabelClick={false}
                    titleMessage={MESSAGES.addLocations}
                    onConfirm={orgUnitsList => {
                        if (!orgUnitsList) {
                            handleChange('addLocations', []);
                            return;
                        }
                        handleChange('addLocations', orgUnitsList);
                    }}
                    multiselect
                    initialSelection={bulkState.addLocations}
                />
                <OrgUnitTreeviewModal
                    toggleOnLabelClick={false}
                    titleMessage={MESSAGES.removeLocations}
                    onConfirm={orgUnitsList => {
                        if (!orgUnitsList) {
                            handleChange('removeLocations', []);
                            return;
                        }
                        handleChange('removeLocations', orgUnitsList);
                    }}
                    multiselect
                    initialSelection={bulkState.removeLocations}
                />
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button onClick={closeAndReset} color="primary">
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                <ConfirmDialog
                    withDivider
                    btnMessage={formatMessage(MESSAGES.validate)}
                    question={
                        <Box className={classes.warningTitle}>
                            <ReportIcon
                                className={classes.warningIcon}
                                color="error"
                                fontSize="large"
                            />
                            {formatMessage(MESSAGES.confirmMultiChange)}
                            <ReportIcon
                                className={classes.warningIcon}
                                color="error"
                                fontSize="large"
                            />
                        </Box>
                    }
                    message={
                        <Typography
                            variant="body2"
                            color="error"
                            component="span"
                            className={classes.warningMessage}
                        >
                            {formatMessage(MESSAGES.bulkChangeCount, {
                                count: `${formatThousand(
                                    selection.selectCount,
                                )}`,
                            })}
                        </Typography>
                    }
                    confirm={() => saveAndReset()}
                    btnDisabled={isEqual(initialState, bulkState)}
                    btnVariant="text"
                />
            </DialogActions>
        </Dialog>
    );
};
