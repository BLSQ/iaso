/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useMemo, useCallback } from 'react';
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
import AddBox from '@mui/icons-material/AddBoxOutlined';
import { FormattedMessage } from 'react-intl';
import {
    commonStyles,
    DHIS2Svg,
    IconButton as IconButtonComponent,
    Table,
    useSafeIntl,
} from 'bluesquare-components';
import 'react-table';
import { CopySourceVersion } from './CopySourceVersion/CopySourceVersion.tsx';

import DialogComponent from '../../../components/dialogs/DialogComponent';
import MESSAGES from '../messages';
import { AddTask } from './AddTaskComponent';
import { ImportGeoPkgDialog } from './ImportGeoPkgDialog';
import { AddNewEmptyVersion } from './AddNewEmptyVersion.tsx';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { EditSourceVersion } from './EditSourceVersion.tsx';
import {
    getSortedSourceVersions,
    handleSort,
    handleTableParamsChange,
    getTableParams,
    getTablePages,
} from '../utils';

const useStyles = makeStyles(theme => ({
    spanStyle: {
        marginLeft: '4px',
    },
    ...commonStyles(theme),
}));

const tableColumns = (source, forceRefreshParent) => [
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
        sortable: true,
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
                id="iaso.versionsDialog.label.updatedAt"
                defaultMessage="Updated"
            />
        ),
        accessor: 'updated_at',
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
        Header: (
            <FormattedMessage
                id="iaso.label.actions"
                defaultMessage="Action(s)"
            />
        ),
        accessor: 'actions',
        sortable: false,
        width: 200,
        Cell: settings => {
            return source.read_only ? (
                <FormattedMessage id="Read Only" />
            ) : (
                <>
                    <EditSourceVersion
                        sourceVersionId={settings.row.original.id}
                        description={settings.row.original.description}
                        sourceVersionNumber={settings.row.original.number}
                        dataSourceId={source.id}
                        forceRefreshParent={forceRefreshParent}
                    />
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
                        dataSourceId={source.id}
                        dataSourceVersionNumber={settings.row.original.number}
                        dataSourceName={source.name}
                    />
                </>
            );
        },
    },
];

const VersionsDialog = ({ renderTrigger, source, forceRefreshParent }) => {
    const { spanStyle, ...classes } = useStyles();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState('number');
    const dataForTable = useMemo(
        () => source?.versions ?? [],
        [source?.versions],
    );
    const { formatMessage } = useSafeIntl();

    const formatDataForTable = useCallback(
        (tableData, sortFunc) =>
            tableData
                .sort(sortFunc)
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [page, rowsPerPage],
    );

    const sortedData = useMemo(() => {
        return getSortedSourceVersions(
            dataForTable,
            sortFocus,
            sortBy,
            formatDataForTable,
            formatMessage,
        );
    }, [dataForTable, sortFocus, sortBy, formatDataForTable, formatMessage]);

    const handleSortFunction = useCallback(
        focus => {
            handleSort(focus, sortFocus, sortBy, setSortFocus, setSortBy);
        },
        [sortBy, sortFocus],
    );

    const handleTableParamsChangeFunction = tableParams => {
        handleTableParamsChange(
            tableParams,
            handleSortFunction,
            setRowsPerPage,
            setPage,
        );
    };

    const titleMessage = (
        <FormattedMessage
            id="iaso.versionsDialog.label.dialogVersions"
            defaultMessage="Versions on source: {source}"
            values={{
                source: source.name,
            }}
        />
    );
    const params = useMemo(() => {
        return getTableParams(rowsPerPage, page);
    }, [page, rowsPerPage]);

    const pages = useMemo(() => {
        return getTablePages(dataForTable, rowsPerPage);
    }, [dataForTable, rowsPerPage]);

    return (
        <DialogComponent
            dataTestId="versions-dialog-modal"
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            classes={classes}
            maxWidth="md"
            renderActions={({ closeDialog }) => (
                <DialogActions className={classes.action}>
                    <Button onClick={closeDialog} color="primary">
                        <FormattedMessage
                            id="iaso.label.close"
                            defaultMessage="Close"
                        />
                    </Button>
                </DialogActions>
            )}
        >
            <Table
                data={sortedData}
                columns={tableColumns(source, forceRefreshParent)}
                params={params}
                page={page}
                pages={pages}
                elevation={0}
                count={source?.versions.length ?? 0}
                onTableParamsChange={handleTableParamsChangeFunction}
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
                            <span className={spanStyle}>
                                <FormattedMessage
                                    id="iaso.versionsDialog.label.newVersionDhis2"
                                    defaultMessage="New version from DHIS2"
                                />
                            </span>
                        </Button>
                    )}
                    sourceId={source.id}
                    sourceCredentials={source.credentials ?? {}}
                />
                <ImportGeoPkgDialog
                    renderTrigger={({ openDialog }) => (
                        <Button onClick={openDialog}>
                            <Public />
                            <span className={spanStyle}>
                                <FormattedMessage
                                    id="iaso.versionsDialog.label.newVersionGpkg"
                                    defaultMessage="New version from a Geopackage"
                                />
                            </span>
                        </Button>
                    )}
                    sourceId={source.id}
                    sourceName={source.name}
                    projects={source.projects.flat()}
                />

                <AddNewEmptyVersion
                    renderTrigger={({ openDialog }) => (
                        <Button onClick={openDialog}>
                            <AddBox />
                            <span className={spanStyle}>
                                <FormattedMessage
                                    id="iaso.versionsDialog.label.newEmptyVersion"
                                    defaultMessage="New empty version"
                                />
                            </span>
                        </Button>
                    )}
                    sourceId={source.id}
                    forceRefreshParent={forceRefreshParent}
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
    forceRefreshParent: PropTypes.func.isRequired,
};
VersionsDialog.defaultProps = {};

export { VersionsDialog };
