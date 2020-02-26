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

import {
    fetchOrgUnitsTypes,
    fetchProjects,
} from '../../utils/requests';

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

const PERIOD_TYPE_CHOICES = [
    {
        label: 'Tracker',
        value: null,
    },
    {
        label: 'Monthly',
        value: 'MONTH',
    },
    {
        label: 'Quarterly',
        value: 'QUARTER',
    },
    {
        label: 'Yearly',
        value: 'YEAR',
    },
];

class AddFormDialogComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            orgUnitsTypes: [],
            projects: [],
            form: {
                name: null,
                projects: [],
                org_unit_types: [],
                period_type: null,
                single_per_period: null,
                device_field: null,
                location_field: null,
            },
        };
    }

    componentDidMount() {
        Promise.all([
            fetchOrgUnitsTypes(this.props.dispatch),
            fetchProjects(this.props.dispatch),
        ]).then(([orgUnitsTypes, projects]) => {
            this.setState(state => ({
                ...state,
                orgUnitsTypes,
                projects,
            }));
        });
    }

    onChange(key, value) {
        this.setState(state => ({
            form: {
                ...state.form,
                [key]: value,
            },
        }));
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
            projects,
            orgUnitsTypes,
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
                        <Grid container spacing={2} justify="flex-start">
                            <Grid xs={12} item>
                                <InputComponent
                                    keyValue="name"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    value={form.name}
                                    type="text"
                                    label={{
                                        id: 'iaso.label.name',
                                        defaultMessage: 'Name',
                                    }}
                                />
                            </Grid>
                            <Grid xs={6} item>
                                <InputComponent
                                    multi
                                    clearable
                                    keyValue="projects"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    value={form.projects}
                                    type="select"
                                    options={projects.map(p => ({
                                        label: p.name,
                                        value: p.id,
                                    }))}
                                    label={{
                                        id: 'iaso.label.projects',
                                        defaultMessage: 'Projects',
                                    }}
                                />
                                <InputComponent
                                    multi
                                    clearable
                                    keyValue="org_unit_types"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    value={form.org_unit_types}
                                    type="select"
                                    options={orgUnitsTypes.map(o => ({
                                        label: o.name,
                                        value: o.id,
                                    }))}
                                    label={{
                                        id: 'iaso.label.orgUnitsTypes',
                                        defaultMessage: 'Organisation unit types',
                                    }}
                                />
                                <InputComponent
                                    keyValue="period_type"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    value={form.period_type}
                                    type="select"
                                    options={PERIOD_TYPE_CHOICES}
                                    label={{
                                        id: 'iaso.label.periodType',
                                        defaultMessage: 'Period type',
                                    }}
                                />
                                <InputComponent
                                    keyValue="single_per_period"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    value={form.single_per_period}
                                    type="checkbox"
                                    label={{
                                        id: 'iaso.label.singlePerPeriod',
                                        defaultMessage: 'Single per period',
                                    }}
                                />
                            </Grid>
                            <Grid xs={6} item>
                                <InputComponent
                                    keyValue="device_field"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    value={form.device_field}
                                    type="text"
                                    label={{
                                        id: 'iaso.label.deviceField',
                                        defaultMessage: 'Device field',
                                    }}
                                />
                                <InputComponent
                                    keyValue="location_field"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    value={form.location_field}
                                    type="text"
                                    label={{
                                        id: 'iaso.label.locationField',
                                        defaultMessage: 'Location field',
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
    dispatch: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({ dispatch });

export default connect(null, mapDispatchToProps)(
    withStyles(styles)(injectIntl(AddFormDialogComponent)),
);
