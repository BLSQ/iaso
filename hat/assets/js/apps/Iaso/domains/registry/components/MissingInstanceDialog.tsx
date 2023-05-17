import React, { FunctionComponent, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    makeStyles,
    Button,
} from '@material-ui/core';
import {
    useSafeIntl,
    makeFullModal,
    commonStyles,
    Table,
    IconButton,
} from 'bluesquare-components';
import EnketoIcon from '../../instances/components/EnketoIcon';

import { useGetCreateInstance } from '../hooks/useGetCreateInstance';

import { MissingInstanceButton } from './MissingInstanceButton';

import { redirectToReplace } from '../../../routing/actions';
import { RegistryDetailParams } from '../types';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';
import { CompletenessApiResponse } from '../../completenessStats/types';

import { defaultSorted } from '../hooks/useGetEmptyInstanceOrgUnits';

type Props = {
    missingOrgUnitsData: CompletenessApiResponse;
    isOpen: boolean;
    closeDialog: () => void;
    params: RegistryDetailParams;
    formId?: string;
    isFetching: boolean;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'visible',
    },
    title: {
        paddingBottom: 0,
    },
    content: {
        padding: 0,
        '& .MuiTableContainer-root': {
            maxHeight: '60vh',
            overflow: 'auto',
            // @ts-ignore
            borderTop: `1px solid ${theme.palette.ligthGray.border}`,
            // @ts-ignore
            borderBottom: `1px solid ${theme.palette.ligthGray.border}`,
        },
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
        },
        '& .pagination-count': {
            marginRight: theme.spacing(2),
        },
        '& .pagination-previous + div': {
            marginLeft: theme.spacing(2),
        },
        '& .pagination-previous + div + div': {
            marginRight: theme.spacing(2),
        },
        '& .MuiTablePagination-toolbar': {
            padding: theme.spacing(1),
        },
        '& .pagination-row-select': {
            marginLeft: theme.spacing(2),
        },
    },
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
}));

const MissingInstanceDialog: FunctionComponent<Props> = ({
    missingOrgUnitsData,
    closeDialog,
    isOpen,
    params,
    formId,
    isFetching,
}) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const handleClose = useCallback(() => {
        const newParams = {
            ...params,
        };
        delete newParams.missingSubmissionVisible;
        dispatch(redirectToReplace(baseUrls.registryDetail, newParams));
        closeDialog();
    }, [closeDialog, dispatch, params]);
    const creteInstance = useGetCreateInstance(window.location.href, formId);
    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            open={isOpen}
            classes={{
                paper: classes.paper,
            }}
            onClose={handleClose}
            scroll="body"
            id="missing-submbissions"
            data-test="missing-submbissions"
        >
            <DialogTitle className={classes.title}>
                {formatMessage(MESSAGES.missingSubmission)}
            </DialogTitle>
            <DialogContent className={classes.content}>
                <Table
                    marginTop={false}
                    marginBottom={false}
                    data={missingOrgUnitsData.results}
                    pages={missingOrgUnitsData.pages}
                    defaultSorted={defaultSorted}
                    columns={[
                        {
                            Header: formatMessage(MESSAGES.name),
                            id: 'name',
                            accessor: 'name',
                            align: 'left',
                        },
                        {
                            Header: formatMessage(MESSAGES.add),
                            id: 'action',
                            accessor: 'action',
                            sortable: false,
                            width: 50,
                            Cell: settings => {
                                return (
                                    <IconButton
                                        onClick={() =>
                                            creteInstance(
                                                settings.row.original.org_unit
                                                    .id,
                                            )
                                        }
                                        overrideIcon={EnketoIcon}
                                        tooltipMessage={MESSAGES.createOnEnketo}
                                        iconSize="small"
                                        size="small"
                                    />
                                );
                            },
                        },
                    ]}
                    extraProps={{ loading: isFetching }}
                    paramsPrefix="missingSubmissions"
                    count={missingOrgUnitsData.count}
                    params={params}
                    elevation={0}
                    onTableParamsChange={p => {
                        dispatch(redirectToReplace(baseUrls.registryDetail, p));
                    }}
                />
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button
                    onClick={() => {
                        handleClose();
                    }}
                    color="primary"
                    data-test="close-button"
                >
                    {formatMessage(MESSAGES.close)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
const modalWithButton = makeFullModal(
    MissingInstanceDialog,
    MissingInstanceButton,
);

export { modalWithButton as MissingInstanceDialog };
