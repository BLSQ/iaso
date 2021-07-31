import React from 'react';
import PropTypes from 'prop-types';
import { Button, DialogActions, makeStyles } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import {
    ColumnText,
    commonStyles,
    displayDateFromTimestamp,
    Table,
    useSafeIntl,
} from 'bluesquare-components';
import 'react-table';
import DialogComponent from '../../../components/dialogs/DialogComponent';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const tasksTableColumns = () => [
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
        Cell: settings => <ColumnText text={settings.value} />,
    },
];

const VersionsDialog = ({ renderTrigger, source }) => {
    const classes = useStyles();
    const intl = useSafeIntl();

    const titleMessage = {
        id: 'dialog_versions',
        defaultMessage: 'Versions on source: {source}',
        values: {
            source: source.name,
        },
    };

    return (
        <DialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            classes={classes}
            renderActions={({ closeDialog }) => (
                <DialogActions className={classes.action}>
                    <Button onClick={closeDialog} color="primary">
                        <FormattedMessage id="close" />
                    </Button>
                </DialogActions>
            )}
        >
            <Table
                data={source.versions}
                baseUrl=""
                columns={tasksTableColumns(intl.formatMessage)}
                redirectTo={() => {}}
                pages={0}
            />
        </DialogComponent>
    );
};

VersionsDialog.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    source: PropTypes.shape({
        name: PropTypes.string.isRequired,
        versions: PropTypes.array.isRequired,
    }).isRequired,
};
VersionsDialog.defaultProps = {};

export { VersionsDialog };
