import AddBox from '@mui/icons-material/AddBoxOutlined';
import Public from '@mui/icons-material/Public';
import { Button, DialogActions, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    DHIS2Svg,
    Table,
    useSafeIntl,
} from 'bluesquare-components';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import DialogComponent from '../../../components/dialogs/DialogComponent';
import MESSAGES from '../messages';
import { AddNewEmptyVersion } from './AddNewEmptyVersion.tsx';
import { AddTask } from './AddTaskComponent';
import { ImportGeoPkgDialog } from './ImportGeoPkgDialog';

import { useVersionsDialogTableColumns } from '../hooks/useVersionsDialogTableColumns.tsx';
import {
    getSortedSourceVersions,
    getTablePages,
    getTableParams,
    handleSort,
    handleTableParamsChange,
} from '../utils';

const useStyles = makeStyles(theme => ({
    spanStyle: {
        marginLeft: '4px',
    },
    ...commonStyles(theme),
}));

const VersionsDialog = ({ renderTrigger, source }) => {
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

    const columns = useVersionsDialogTableColumns(source);

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
                        {formatMessage(MESSAGES.close)}
                    </Button>
                </DialogActions>
            )}
        >
            <Table
                data={sortedData}
                columns={columns}
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
