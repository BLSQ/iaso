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
} from 'bluesquare-components';
import 'react-table';
import { CopySourceVersion } from './CopySourceVersion/CopySourceVersion.tsx';

import DialogComponent from '../../../components/dialogs/DialogComponent';
import MESSAGES from '../messages';
import { AddTask } from './AddTaskComponent';
import { ImportGeoPkgDialog } from './ImportGeoPkgDialog';
import { AddNewEmptyVersion } from './AddNewEmptyVersion';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { EditSourceVersion } from './EditSourceVersion.tsx';

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
        Header: <FormattedMessage id="iaso.label.actions" />,
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

const sortByNumberAsc = (sourceA, sourceB) => {
    return sourceA.number - sourceB.number;
};
const sortByNumberDesc = (sourceA, sourceB) => {
    return sourceB.number - sourceA.number;
};
const sortByOrgUnitsAsc = (sourceA, sourceB) => {
    return sourceA.org_units_count - sourceB.org_units_count;
};
const sortByOrgUnitsDesc = (sourceA, sourceB) => {
    return sourceB.org_units_count - sourceA.org_units_count;
};

const VersionsDialog = ({ renderTrigger, source, forceRefreshParent }) => {
    const { spanStyle, ...classes } = useStyles();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState('number');
    const [resetPageToOne, setResetPageToOne] = useState(`${rowsPerPage}`);
    const dataForTable = useMemo(
        () => source?.versions ?? [],
        [source?.versions],
    );
    const handleSort = useCallback(
        focus => {
            if (sortFocus !== focus) {
                setSortFocus(focus);
                setSortBy('asc');
            } else if (sortBy === 'asc') {
                setSortBy('desc');
            } else {
                setSortBy('asc');
            }
        },
        [sortBy, sortFocus],
    );

    const handleTableParamsChange = params => {
        if (params.order) {
            handleSort(params.order.replace('-', ''));
        }
        if (params.pageSize) {
            setResetPageToOne(`${params.pageSize}`);
            setRowsPerPage(parseInt(params.pageSize, 10));
        }
        if (params.page) {
            setPage(parseInt(params.page, 10) - 1);
        }
    };

    const formatDataForTable = useCallback(
        (tableData, sortFunc) =>
            tableData
                .sort(sortFunc)
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [page, rowsPerPage],
    );

    const sortedData = useMemo(() => {
        if (sortFocus === 'number' && sortBy === 'asc') {
            return formatDataForTable(dataForTable, sortByNumberAsc);
        }
        if (sortFocus === 'number' && sortBy === 'desc') {
            return formatDataForTable(dataForTable, sortByNumberDesc);
        }
        if (sortFocus === 'org_units_count' && sortBy === 'asc') {
            return formatDataForTable(dataForTable, sortByOrgUnitsAsc);
        }
        if (sortFocus === 'org_units_count' && sortBy === 'desc') {
            return formatDataForTable(dataForTable, sortByOrgUnitsDesc);
        }
        console.warn(
            `Sort error, there must be a wrong parameter. Received: ${sortBy}, ${sortFocus}. Expected a combination of asc|desc and number|org_units_count`,
        );
        return [];
    }, [sortBy, sortFocus, dataForTable, formatDataForTable]);

    const pages = useMemo(() => {
        return dataForTable.length
            ? Math.ceil(dataForTable.length / rowsPerPage)
            : 0;
    }, [dataForTable.length, rowsPerPage]);

    const params = useMemo(
        () => ({
            pageSize: rowsPerPage,
            page,
        }),
        [rowsPerPage, page],
    );

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
            dataTestId="versions-dialog-modal"
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
                data={sortedData}
                columns={tableColumns(source, forceRefreshParent)}
                params={params}
                resetPageToOne={resetPageToOne}
                pages={pages}
                elevation={0}
                count={source?.versions.length ?? 0}
                onTableParamsChange={handleTableParamsChange}
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
