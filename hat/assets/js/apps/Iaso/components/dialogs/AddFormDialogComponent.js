import React, { Fragment, Component } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import Add from '@material-ui/icons/Add';
import {
    withStyles,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
} from '@material-ui/core';
import commonStyles from '../../styles/common';

import InputComponent from '../forms/InputComponent';

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

class AddFormDialogComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            form: {
                name: null,
            },
        };
    }

    onChange(key, value) {
        const newState = {
            ...this.state,
        };
        newState[key] = value;
        this.setState(newState);
    }

    toggleDialog() {
        this.setState({
            open: !this.state.open,
        });
    }

    handleClose(isAccepted) {
        this.toggleDialog();
        if (isAccepted) {
            this.props.createForm(this.state.form);
        }
    }

    render() {
        const {
            classes,
            intl: {
                formatMessage,
            },
        } = this.props;
        const {
            open,
            form,
        } = this.state;
        return (
            <Fragment>
                <Button
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    onClick={() => this.toggleDialog()}
                >
                    <Add className={classes.buttonIcon} />
                    <FormattedMessage
                        id="iaso.forms.create"
                        defaultMessage="Create form"
                    />
                </Button>
                <Dialog
                    fullWidth
                    maxWidth="md"
                    open={open}
                    classes={{
                        paper: classes.paper, // TODO: ???
                    }}
                >
                    <DialogTitle className={classes.title}>
                        <FormattedMessage
                            id="iaso.forms.create"
                            defaultMessage="Create form"
                        />
                    </DialogTitle>
                    <DialogContent className={classes.content}>
                        <Grid container spacing={2} alignItems="center" justify="flex-start">
                            <Grid xs={6} item>
                                <InputComponent
                                    keyValue="name"
                                    onChange={this.onChange}
                                    value={form.name}
                                    type="text"
                                    label={{
                                        id: 'iaso.forms.input_name',
                                        defaultMessage: 'Name',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions className={classes.action}>
                        <Button onClick={() => this.handleClose(false)} color="primary">
                            <FormattedMessage
                                id="iaso.label.cancel"
                                defaultMessage="Cancel"
                            />
                        </Button>
                        <Button
                            onClick={() => this.handleClose(true)}
                            disabled={false} // todo: basic validation
                            color="primary"
                            autoFocus
                        >
                            <FormattedMessage
                                id="iaso.label.save"
                                defaultMessage="Save"
                            />
                        </Button>
                    </DialogActions>
                </Dialog>
            </Fragment>
        );
    }
}

AddFormDialogComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    createForm: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    // todo: org unit types and projects
});

export default connect(mapStateToProps)(
    withStyles(styles)(injectIntl(AddFormDialogComponent)),
);
