import React from 'react';
import { connect } from 'react-redux';
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
} from '@material-ui/core';

import {
    saveGroup as saveGroupAction,
    fetchGroups as fetchGroupsAction,
    createGroup as createGroupAction,
} from '../groups/actions';
import { formatThousand } from '../../../../../utils';

import commonStyles from '../../../styles/common';
import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';

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
const OrgUnitsMultiActionsDialog = ({
    open,
    closeDialog,
    classes,
    groups,
    selectCount,
}) => {
    const [groupsSelected, setGroupsSelected] = React.useState([]);
    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            open={open}
            classes={{
                paper: classes.paper,
            }}
            onBackdropClick={closeDialog}
            scroll="body"
        >
            <DialogTitle className={classes.title}>
                <FormattedMessage
                    {...MESSAGES.multiEditTitle}
                />
                {` (${formatThousand(selectCount)} `}

                <FormattedMessage
                    {...MESSAGES.titleMulti}
                />
                )
            </DialogTitle>
            <DialogContent className={classes.content}>
                <InputComponent
                    multi
                    clearable
                    keyValue="groups"
                    onChange={(key, value) => setGroupsSelected(value)}
                    value={groupsSelected.length > 0 ? groupsSelected : null}
                    type="select"
                    options={groups.map(g => ({
                        label: g.name,
                        value: g.id,
                    }))}
                    label={MESSAGES.group}
                    isSearchable
                />
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button onClick={closeDialog} color="primary">
                    <FormattedMessage {...MESSAGES.cancel} />
                </Button>
                <Button
                    onClick={closeDialog}
                    color="primary"
                    autoFocus
                    disabled={groupsSelected.length === 0}
                >
                    <FormattedMessage {...MESSAGES.validate} />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

OrgUnitsMultiActionsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    groups: PropTypes.array.isRequired,
    closeDialog: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    selectedItems: PropTypes.array.isRequired,
    unSelectedItems: PropTypes.array.isRequired,
    selectAll: PropTypes.bool.isRequired,
    selectCount: PropTypes.number.isRequired,
};


const MapStateToProps = state => ({
    groups: state.orgUnits.groups,
    selectedItems: state.tableSelect.selectedItems,
    unSelectedItems: state.tableSelect.unSelectedItems,
    selectAll: state.tableSelect.selectAll,
    selectCount: state.tableSelect.count,
});

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchGroups: fetchGroupsAction,
            saveGroup: saveGroupAction,
            createGroup: createGroupAction,
        }, dispatch),
    }
);
export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(OrgUnitsMultiActionsDialog),
);
