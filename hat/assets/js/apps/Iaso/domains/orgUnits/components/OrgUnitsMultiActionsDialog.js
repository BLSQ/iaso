import React from 'react';
import { connect, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    withStyles,
    Box,
    Grid,
    Typography,
} from '@material-ui/core';

import {
    selectionInitialState,
    commonStyles,
    formatThousand,
} from 'bluesquare-components';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { saveMultiEdit as saveMultiEditAction } from '../actions';

import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';
import { compareGroupVersions, decodeSearch } from '../utils';
import { useGetGroups } from '../hooks';

const styles = theme => ({
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
});

const stringOfIdsToArrayofIds = stringValue =>
    !stringValue || stringValue === ''
        ? []
        : stringValue.split(',').map(s => parseInt(s, 10));

const OrgUnitsMultiActionsDialog = ({
    open,
    closeDialog,
    classes,
    orgUnitTypes,
    selection: { selectCount, selectedItems, unSelectedItems, selectAll },
    params,
    saveMultiEdit,
    fetchOrgUnits,
}) => {
    const [editGroups, setEditGroups] = React.useState(false);
    const [groupsAdded, setGroupsAdded] = React.useState([]);
    const [groupsRemoved, setGroupsRemoved] = React.useState([]);
    const [editOrgUnitType, setEditOrgUnitType] = React.useState(false);
    const [orgUnitType, setOrgUnitType] = React.useState(null);
    const [editValidation, setEditValidation] = React.useState(false);
    const [validationStatus, setValidationStatus] = React.useState(null);

    const currentUser = useCurrentUser();
    const { groups = [], isFetchingGroups } = useGetGroups({
        dataSourceId: currentUser?.account?.default_version?.data_source?.id,
        sourceVersionId: currentUser?.account?.default_version?.id,
    });
    const isSaveDisabled = () =>
        (editGroups &&
            groupsAdded.length === 0 &&
            groupsRemoved.length === 0) ||
        (editOrgUnitType && !orgUnitType) ||
        (editValidation && validationStatus === null) ||
        (!editGroups && !editOrgUnitType && !editValidation);
    const groupsWithoutAdded = [...groups].filter(
        g => groupsAdded.indexOf(g.id) === -1,
    );
    const handleSetEditGroups = editEnabled => {
        if (!editEnabled) {
            setGroupsAdded([]);
            setGroupsRemoved([]);
        }
        setEditGroups(editEnabled);
    };
    const handleSetEditOuType = editEnabled => {
        if (!editEnabled) {
            setEditOrgUnitType(null);
        }
        setEditOrgUnitType(editEnabled);
    };
    const handleSetEditValidation = editEnabled => {
        if (!editEnabled) {
            setValidationStatus(null);
        }
        setEditValidation(editEnabled);
    };
    const closeAndReset = () => {
        setEditGroups(false);
        setGroupsAdded([]);
        setGroupsRemoved([]);
        setEditOrgUnitType(false);
        setOrgUnitType(null);
        setEditValidation(false);
        setValidationStatus(null);
        closeDialog();
    };
    const saveAndReset = () => {
        const data = {};
        if (editGroups) {
            if (groupsAdded.length > 0) {
                data.groups_added = groupsAdded;
            }
            if (groupsRemoved.length > 0) {
                data.groups_removed = groupsRemoved;
            }
        }
        if (editOrgUnitType) {
            data.org_unit_type = orgUnitType;
        }
        if (editValidation) {
            data.validation_status = validationStatus;
        }
        if (!selectAll) {
            data.selected_ids = selectedItems.map(i => i.id);
        } else {
            data.select_all = true;
            data.unselected_ids = unSelectedItems.map(i => i.id);
            // TODO : taken from OrgUnitsFiltersComponent to match
            // their fix but not a fan we should change it
            // when we refactor the search, probably set orgUnitParentId
            // directly in the onchange of OrgUnitTreeviewModal.
            const searches = decodeSearch(params.searches);
            searches.forEach((s, i) => {
                searches[i].orgUnitParentId = searches[i].levels;
            });
            data.searches = searches;
        }
        saveMultiEdit(data).then(() => {
            closeAndReset();
            fetchOrgUnits();
        });
    };
    return (
        <>
            <Dialog
                fullWidth
                maxWidth="xs"
                open={open}
                classes={{
                    paper: classes.paper,
                }}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') {
                        closeAndReset();
                    }
                }}
                scroll="body"
            >
                <DialogTitle className={classes.title}>
                    <FormattedMessage {...MESSAGES.multiEditTitle} />
                    {` (${formatThousand(selectCount)} `}
                    {selectCount === 1 && (
                        <FormattedMessage {...MESSAGES.titleSingle} />
                    )}
                    {selectCount > 1 && (
                        <FormattedMessage {...MESSAGES.titleMulti} />
                    )}
                    )
                </DialogTitle>
                <DialogContent className={classes.content}>
                    <div>
                        <InputComponent
                            keyValue="editGroups"
                            onChange={(key, checked) =>
                                handleSetEditGroups(checked)
                            }
                            value={editGroups}
                            type="checkbox"
                            label={MESSAGES.editGroups}
                        />
                        {editGroups && (
                            <>
                                <InputComponent
                                    multi
                                    clearable
                                    keyValue="addGroups"
                                    onChange={(key, value) =>
                                        setGroupsAdded(
                                            stringOfIdsToArrayofIds(value),
                                        )
                                    }
                                    value={
                                        groupsAdded.length > 0
                                            ? groupsAdded
                                            : null
                                    }
                                    type="select"
                                    loading={isFetchingGroups}
                                    options={groups
                                        .sort(compareGroupVersions)
                                        .map(g => ({
                                            label: `${g.name} - Version: ${g.source_version.number}`,
                                            value: g.id,
                                        }))}
                                    label={MESSAGES.addToGroups}
                                />
                                <InputComponent
                                    multi
                                    clearable
                                    keyValue="removeGroups"
                                    onChange={(key, value) =>
                                        setGroupsRemoved(
                                            stringOfIdsToArrayofIds(value),
                                        )
                                    }
                                    value={
                                        groupsRemoved.length > 0
                                            ? groupsRemoved
                                            : null
                                    }
                                    type="select"
                                    options={groupsWithoutAdded.map(g => ({
                                        label: `${g.name} - Version: ${g.source_version.number}`,
                                        value: g.id,
                                    }))}
                                    label={MESSAGES.removeFromGroups}
                                />
                            </>
                        )}
                    </div>
                    <div>
                        <InputComponent
                            keyValue="editOrgUnitType"
                            onChange={(key, checked) =>
                                handleSetEditOuType(checked)
                            }
                            value={editOrgUnitType}
                            type="checkbox"
                            label={MESSAGES.editOrgUnitType}
                        />
                        {editOrgUnitType && (
                            <InputComponent
                                multi={false}
                                clearable
                                keyValue="changeOrgUnitType"
                                onChange={(key, value) => setOrgUnitType(value)}
                                value={orgUnitType}
                                type="select"
                                options={orgUnitTypes.map(ot => ({
                                    label: ot.name,
                                    value: ot.id,
                                }))}
                                label={MESSAGES.org_unit_type}
                                isSearchable
                            />
                        )}
                    </div>
                    <div>
                        <InputComponent
                            keyValue="editValidation"
                            onChange={(key, checked) =>
                                handleSetEditValidation(checked)
                            }
                            value={editValidation}
                            type="checkbox"
                            label={MESSAGES.editValidation}
                        />
                        {editValidation && (
                            <div className={classes.marginLeft}>
                                <InputComponent
                                    keyValue="isValid"
                                    onChange={(key, value) => {
                                        setValidationStatus(value);
                                    }}
                                    value={validationStatus}
                                    type="radio"
                                    options={[
                                        {
                                            value: 'NEW',
                                            label: (
                                                <FormattedMessage
                                                    {...MESSAGES.new}
                                                />
                                            ),
                                        },
                                        {
                                            value: 'VALID',
                                            label: (
                                                <FormattedMessage
                                                    {...MESSAGES.valid}
                                                />
                                            ),
                                        },
                                        {
                                            value: 'REJECTED',
                                            label: (
                                                <FormattedMessage
                                                    {...MESSAGES.rejected}
                                                />
                                            ),
                                        },
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
                <DialogActions className={classes.action}>
                    <Button onClick={closeAndReset} color="primary">
                        <FormattedMessage {...MESSAGES.cancel} />
                    </Button>

                    <ConfirmDialog
                        btnMessage={<FormattedMessage {...MESSAGES.validate} />}
                        question={
                            <Grid direction="column" container>
                                <Grid item>
                                    <Box>
                                        <FormattedMessage
                                            {...MESSAGES.confirmMultiChange}
                                        />
                                        <>🚨</>
                                    </Box>
                                </Grid>
                                <Grid item>
                                    <Box>
                                        <Typography variant="body2">
                                            <FormattedMessage
                                                {...MESSAGES.bulkChangeCount}
                                                values={{
                                                    count: selectCount ?? 0,
                                                }}
                                            />
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        }
                        confirm={() => saveAndReset()}
                        btnDisabled={isSaveDisabled()}
                        btnVariant="text"
                    />
                </DialogActions>
            </Dialog>
        </>
    );
};
OrgUnitsMultiActionsDialog.defaultProps = {
    selection: selectionInitialState,
};

OrgUnitsMultiActionsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    closeDialog: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    saveMultiEdit: PropTypes.func.isRequired,
    fetchOrgUnits: PropTypes.func.isRequired,
    selection: PropTypes.object,
};

const MapStateToProps = state => ({
    orgUnitTypes: state.orgUnits.orgUnitTypes,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            saveMultiEdit: saveMultiEditAction,
        },
        dispatch,
    ),
});
export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(OrgUnitsMultiActionsDialog),
);
