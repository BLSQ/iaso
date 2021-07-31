/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    DialogActions,
    Grid,
    makeStyles,
    Tooltip,
    Typography,
} from '@material-ui/core';
import Public from '@material-ui/icons/Public';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { FormattedMessage } from 'react-intl';
import {
    ColumnText,
    commonStyles,
    DHIS2Svg,
    displayDateFromTimestamp,
    IconButton as IconButtonComponent,
    Table,
    useSafeIntl,
} from 'bluesquare-components';
import 'react-table';

import DialogComponent from '../../../components/dialogs/DialogComponent';
import MESSAGES from '../messages';
import { AddTask } from './AddTaskComponent';
import { ImportGeoPkgDialog } from './ImportGeoPkgDialog';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const tasksTableColumns = source => [
    {
        Header: <FormattedMessage {...MESSAGES.defaultVersion} />,
        accessor: '',
        sortable: false,
        Cell: settings =>
            source.default_version?.id === settings.original.id && (
                <Tooltip
                    title={<FormattedMessage {...MESSAGES.defaultVersion} />}
                >
                    <CheckCircleIcon color="primary" />
                </Tooltip>
            ),
    },
    {
        Header: <FormattedMessage id="number" defaultMessage="Number" />,
        sortable: false,
        accessor: 'number',
    },
    {
        Header: (
            <FormattedMessage id="created_at" defaultMessage="Created at" />
        ),
        accessor: 'created_at',
        sortable: false,
        Cell: settings => displayDateFromTimestamp(settings.value),
    },
    {
        Header: (
            <FormattedMessage id="description" defaultMessage="Description" />
        ),
        accessor: 'description',
        sortable: false,
        Cell: settings => <ColumnText text={settings.value ?? ''} />,
    },
    {
        Header: <FormattedMessage id="iaso.label.actions" />,
        sortable: false,
        Cell: settings =>
            source.read_only ? (
                <FormattedMessage id="Read Only" />
            ) : (
                <>
                    <AddTask
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="dhis"
                                tooltipMessage={MESSAGES.edit}
                            />
                        )}
                        sourceId={source.id}
                        sourceVersionNumber={settings.original.number}
                        sourceCredentials={source.credentials ?? {}}
                    />
                    <ImportGeoPkgDialog
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="globe"
                                tooltipMessage={MESSAGES.importGeoPkg}
                            />
                        )}
                        sourceId={source.id}
                        sourceName={source.name}
                        versionNumber={settings.original.number}
                        projects={source.projects.flat()}
                    />
                </>
            ),
    },
];

const VersionsDialog = ({ renderTrigger, source }) => {
    const classes = useStyles();
    const intl = useSafeIntl();

    const titleMessage = (
        <FormattedMessage
            id="dialog_versions"
            defaultMessage="Versions on source: {source}"
            values={{
                source: source.name,
            }}
        />
    );

    return (
        <DialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            classes={classes}
            maxWidth="md"
            renderActions={({ closeDialog }) => (
                <DialogActions className={classes.action}>
                    <Button onClick={closeDialog} color="primary">
                        <FormattedMessage id="iaso.label.close" />
                    </Button>
                </DialogActions>
            )}
        >
            <Table
                data={source.versions}
                baseUrl=""
                columns={tasksTableColumns(source, intl.formatMessage)}
                redirectTo={() => {}}
                pages={0}
            />
            {source.versions.length === 0 && (
                <Typography style={{ padding: 5 }}>
                    <FormattedMessage
                        id="datasource.no_version"
                        defaultMessage="This datasource is empty, please create a versions using one of the buttons below"
                    />
                </Typography>
            )}
            <Grid item>
                <AddTask
                    renderTrigger={({ openDialog }) => (
                        <Button onClick={openDialog}>
                            <DHIS2Svg />
                            &nbsp;
                            <FormattedMessage
                                id="new_version_dhis2"
                                defaultMessage=" New version from DHIS2"
                            />
                        </Button>
                    )}
                    sourceId={source.id}
                    sourceCredentials={source.credentials ?? {}}
                />
                <ImportGeoPkgDialog
                    renderTrigger={({ openDialog }) => (
                        <Button onClick={openDialog}>
                            <Public />
                            &nbsp;
                            <FormattedMessage
                                id="new_version_gpkg"
                                defaultMessage=" New version from a Geopackage"
                            />
                        </Button>
                    )}
                    sourceId={source.id}
                    sourceName={source.name}
                    projects={source.projects.flat()}
                />
            </Grid>
        </DialogComponent>
    );
};

VersionsDialog.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    source: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        versions: PropTypes.array.isRequired,
        credentials: PropTypes.object,
        projects: PropTypes.array.isRequired,
    }).isRequired,
};
VersionsDialog.defaultProps = {};

export { VersionsDialog };
