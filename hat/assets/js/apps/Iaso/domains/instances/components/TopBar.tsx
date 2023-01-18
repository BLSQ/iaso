import React, { useState, useEffect, FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';

import { makeStyles, Grid, Tabs, Tab } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';

import { redirectToReplace } from '../../../routing/actions';

import {
    NewColumn,
    useGetInstancesColumns,
    useGetInstancesVisibleColumns,
} from '../utils';

import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import MESSAGES from '../messages';
import { INSTANCE_METAS_FIELDS } from '../constants';

import { VisibleColumn } from '../types/visibleColumns';
import { Form, PossibleField } from '../../forms/types/forms';
import { Column } from '../../../types/table';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
}));
type Params = {
    order?: string;
    showDeleted?: string;
    columns?: string;
};
type Props = {
    formName: string;
    tab: string;
    // eslint-disable-next-line no-unused-vars
    handleChangeTab: (newTab: string) => void;
    params: Params;
    periodType?: string;
    // eslint-disable-next-line no-unused-vars
    setTableColumns: (newTableColumns: Column[]) => void;
    baseUrl: string;
    labelKeys: string[];
    possibleFields?: PossibleField[];
    formDetails: Form;
    tableColumns: Column[];
    formIds: string[];
};

const defaultOrder = 'updated_at';

export const InstancesTopBar: FunctionComponent<Props> = ({
    formName,
    tab,
    handleChangeTab,
    params,
    periodType,
    setTableColumns,
    baseUrl,
    labelKeys,
    possibleFields,
    formDetails,
    tableColumns,
    formIds,
}) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const [visibleColumns, setVisibleColumns] = useState<VisibleColumn[]>([]);
    const getInstancesVisibleColumns = useGetInstancesVisibleColumns({
        order: params.order,
        defaultOrder,
    });
    const getInstancesColumns = useGetInstancesColumns(
        params.showDeleted === 'true',
    );
    const handleChangeVisibleColmuns = (cols, withRedirect = true) => {
        const columns = cols.filter(c => c.active);
        const newParams: Params = {
            ...params,
        };
        if (columns.length > 0) {
            newParams.columns = columns.map(c => c.key).join(',');
        }
        const newTablecols = getInstancesColumns(cols);
        // TODO this part of the code should be refactored, it leads too infinite loop
        if (
            JSON.stringify(newTablecols) !== JSON.stringify(tableColumns) &&
            newTablecols.length > 1
        ) {
            setTableColumns(newTablecols);
        }
        setVisibleColumns(cols);
        if (withRedirect) {
            dispatch(redirectToReplace(baseUrl, newParams));
        }
    };

    useEffect(() => {
        let newColsString;
        if (params.columns) {
            newColsString = params.columns;
        } else {
            newColsString = INSTANCE_METAS_FIELDS.filter(
                f => Boolean(f.tableOrder) && f.active,
            ).map(f => f.accessor || f.key);
            if (formIds && formIds.length === 1) {
                newColsString = newColsString.filter(c => c !== 'form__name');
                if (periodType === null) {
                    newColsString = newColsString.filter(c => c !== 'period');
                }
            }
            newColsString = newColsString.join(',');
            if (labelKeys.length > 0) {
                newColsString = `${newColsString},${labelKeys.join(',')}`;
            }
        }
        let newCols: NewColumn[] = [];
        // single form
        if (formIds?.length === 1) {
            // if detail loaded
            if (formDetails) {
                newCols = getInstancesVisibleColumns(
                    possibleFields,
                    newColsString,
                );
            } else if (visibleColumns.length > 0) {
                // remove columns while reloading
                handleChangeVisibleColmuns([], false);
            }
            // multi forms
        } else {
            newCols = getInstancesVisibleColumns(undefined, newColsString);
        }
        if (newCols.length > 0) {
            handleChangeVisibleColmuns(newCols, !params.columns);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [possibleFields, formDetails, formIds]);

    let title = formatMessage(MESSAGES.titleMulti);
    if (formIds?.length === 1) {
        title = `${formatMessage(MESSAGES.title)}: ${formName}`;
    }
    return (
        <TopBar title={title}>
            <Grid container spacing={0}>
                <Grid xs={10} item>
                    <Tabs
                        value={tab}
                        classes={{
                            root: classes.tabs,
                            indicator: classes.indicator,
                        }}
                        onChange={(event, newtab) => handleChangeTab(newtab)}
                    >
                        <Tab
                            value="list"
                            label={formatMessage(MESSAGES.list)}
                        />
                        <Tab value="map" label={formatMessage(MESSAGES.map)} />
                        <Tab
                            value="files"
                            label={formatMessage(MESSAGES.files)}
                        />
                    </Tabs>
                </Grid>
                <Grid
                    xs={2}
                    item
                    container
                    alignItems="center"
                    justifyContent="flex-end"
                    className={classes.selectColmunsContainer}
                >
                    <ColumnsSelectDrawer
                        options={visibleColumns}
                        setOptions={cols => handleChangeVisibleColmuns(cols)}
                    />
                </Grid>
            </Grid>
        </TopBar>
    );
};
