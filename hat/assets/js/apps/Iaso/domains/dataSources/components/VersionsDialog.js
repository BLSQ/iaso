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
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FormattedMessage } from 'react-intl';
import {
    commonStyles,
    DHIS2Svg,
    IconButton as IconButtonComponent,
    Table,
} from 'bluesquare-components';
import 'react-table';
import { CopySourceVersion } from './CopySourceVersion.tsx';

import DialogComponent from '../../../components/dialogs/DialogComponent';
import MESSAGES from '../messages';
import { AddTask } from './AddTaskComponent';
import { ImportGeoPkgDialog } from './ImportGeoPkgDialog';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const tableColumns = source => [
    {
        Header: <FormattedMessage {...MESSAGES.defaultVersion} />,
        accessor: 'id',
        sortable: false,
        Cell: settings =>
            source.default_version?.id === settings.value && (
                <Tooltip
                    title={<FormattedMessage {...MESSAGES.defaultVersion} />}
                >
                    <CheckCircleIcon color="primary" />
                </Tooltip>
            ),
    },
    {
        Header: (
            <FormattedMessage
                id="iaso.versionsDialog.label.number"
                defaultMessage="Number"
            />
        ),
        sortable: false,
        accessor: 'number',
    },
    {
        Header: (
            <FormattedMessage
                id="iaso.versionsDialog.label.createdAt"
                defaultMessage="Created"
            />
        ),
        accessor: 'created_at',
        sortable: false,
        Cell: DateTimeCell,
    },
    {
        Header: (
            <FormattedMessage
                id="iaso.label.orgUnit"
                defaultMessage="Org units"
            />
        ),
        accessor: 'org_units_count',
    },
    {
        Header: (
            <FormattedMessage
                id="iaso.versionsDialog.label.description"
                defaultMessage="Description"
            />
        ),
        accessor: 'description',
        sortable: false,
    },
    {
        Header: <FormattedMessage id="iaso.label.actions" />,
        accessor: 'actions',
        sortable: false,
        width:200,
        Cell: settings =>{
            return (source.read_only ? (
                <FormattedMessage id="Read Only" />
            ) : (
                <>
                    <AddTask
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="dhis"
                                tooltipMessage={MESSAGES.updateFromDhis2}
                            />
                        )}
                        sourceId={source.id}
                        sourceVersionNumber={settings.row.original.number}
                        sourceCredentials={source.credentials ?? {}}
                    />
                    <ImportGeoPkgDialog
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="globe"
                                tooltipMessage={MESSAGES.gpkgTooltip}
                            />
                        )}
                        sourceId={source.id}
                        sourceName={source.name}
                        versionNumber={settings.row.original.number}
                        projects={source.projects.flat()}
                    />
                       <CopySourceVersion
                            renderTrigger={({ openDialog }) => (
                                <IconButtonComponent
                                    onClick={openDialog}
                                    overrideIcon={FileCopyIcon}
                                    tooltipMessage={MESSAGES.copyVersion}
                                />

                            )}
                            dataSourceId={source.id}
                            dataSourceVersionNumber={settings.row.original.number}
                            dataSourceName={source.name}
                    />
                </>))}
            
    },
];

const VersionsDialog = ({ renderTrigger, source }) => {
    const classes = useStyles();

    const titleMessage = (
        <FormattedMessage
            id="iaso.versionsDialog.label.dialogVersions"
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
                columns={tableColumns(source)}
                redirectTo={() => {}}
                pages={0}
                elevation={0}
            />
            {source.versions.length === 0 && (
                <Typography style={{ padding: 5 }}>
                    <FormattedMessage
                        id="iaso.versionsDialog.label.datasource.noVersion"
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
                                id="iaso.versionsDialog.label.newVersionDhis2"
                                defaultMessage="New version from DHIS2"
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
                                id="iaso.versionsDialog.label.newVersionGpkg"
                                defaultMessage="New version from a Geopackage"
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
