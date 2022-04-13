import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { makeStyles, Grid, Tabs, Tab } from '@material-ui/core';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';

import { redirectToReplace } from '../../../routing/actions';
import { getInstancesColumns, getInstancesVisibleColumns } from '../utils';

import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import MESSAGES from '../messages';
import { INSTANCE_METAS_FIELDS } from '../constants';
import { FormDefiningContext } from '../context/FormDefiningContext.tsx';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
}));

const defaultOrder = 'updated_at';

const InstancesTopBar = ({
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
}) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { setFormId, setFormDefiningId } =
        useContext(FormDefiningContext);
    const currentUser = useSelector(state => state.users.current);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const { formatMessage } = useSafeIntl();

    const formIds = params.formIds?.split(',');

    const handleChangeVisibleColmuns = (cols, withRedirect = true) => {
        const newParams = {
            ...params,
            columns: cols
                .filter(c => c.active)
                .map(c => c.key)
                .join(','),
        };
        setTableColumns(
            getInstancesColumns(
                formatMessage,
                cols,
                params.showDeleted === 'true',
                currentUser,
                dispatch,
                setFormId,
                setFormDefiningId
            ),
        );
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
        let newCols = [];
        // single form
        if (formIds?.length === 1) {
            // if detail loaded
            if (formDetails) {
                // possibleFields set by default to null, array if fetched
                if (possibleFields) {
                    newCols = getInstancesVisibleColumns({
                        formatMessage,
                        columns: newColsString,
                        order: params.order,
                        defaultOrder,
                        possibleFields,
                    });
                }
            } else if (visibleColumns.length > 0) {
                // remove columns while reloading
                handleChangeVisibleColmuns([], false);
            }
            // multi forms
        } else {
            newCols = getInstancesVisibleColumns({
                formatMessage,
                columns: newColsString,
                order: params.order,
                defaultOrder,
            });
        }
        handleChangeVisibleColmuns(newCols, !params.columns);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [possibleFields, formDetails]);

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

InstancesTopBar.defaultProps = {
    periodType: null,
    possibleFields: null,
    tableColumns: [],
    labelKeys: [],
    formDetails: null,
};

InstancesTopBar.propTypes = {
    formName: PropTypes.string.isRequired,
    tab: PropTypes.string.isRequired,
    handleChangeTab: PropTypes.func.isRequired,
    tableColumns: PropTypes.array,
    params: PropTypes.object.isRequired,
    setTableColumns: PropTypes.func.isRequired,
    periodType: PropTypes.any,
    baseUrl: PropTypes.string.isRequired,
    possibleFields: PropTypes.any,
    labelKeys: PropTypes.array,
    formDetails: PropTypes.object,
};

export { InstancesTopBar };
