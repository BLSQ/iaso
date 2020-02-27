import React, { Fragment, Component } from 'react';
import _ from 'lodash';

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
    createForm,
    createFormVersion,
} from '../../utils/requests';

import InputComponent from '../forms/InputComponent';
import FileInputComponent from '../forms/FileInputComponent';

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
            form: AddFormDialogComponent.blankFormState(),
        };
    }

    static blankFormState() {
        return {
            name: null,
            xls_file: null,
            project_ids: null,
            org_unit_type_ids: null,
            period_type: null,
            single_per_period: null,
            device_field: null,
            location_field: null,
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
            // TODO: move in async action
            const formData = _.omit(this.state.form, 'xls_file');
            createForm(this.props.dispatch, formData)
                .then((createdFormData) => {
                    createFormVersion(this.props.dispatch, {
                        form_id: createdFormData.id,
                        xls_file: this.state.form.xls_file,
                    })
                        .then(() => {
                            this.setState({ form: AddFormDialogComponent.blankFormState() });
                            // TODO: trigger list reload
                        });
                });
        }
    }

    render() {
        const { classes } = this.props;
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
                            <Grid xs={6} item>
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
                                {
                                    // TODO: select input component should return a list of values of the same type as the provided values
                                }
                                <InputComponent
                                    multi
                                    clearable
                                    keyValue="project_ids"
                                    onChange={(key, value) => this.onChange(key, value.split(', ').map(parseInt))}
                                    value={form.project_ids}
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
                                {
                                    // TODO: select input component should return a list of values of the same type as the provided values
                                }
                                <InputComponent
                                    multi
                                    clearable
                                    keyValue="org_unit_type_ids"
                                    onChange={(key, value) => this.onChange(key, value.split(', ').map(parseInt))}
                                    value={form.org_unit_type_ids}
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
                                <FileInputComponent
                                    keyValue="xls_file"
                                    onChange={(key, value) => this.onChange(key, value)}
                                    label={{
                                        id: 'iaso.label.xls_form_file',
                                        defaultMessage: 'XLSForm file',
                                    }}
                                />
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
    dispatch: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({ dispatch });

export default connect(null, mapDispatchToProps)(
    withStyles(styles)(injectIntl(AddFormDialogComponent)),
);
