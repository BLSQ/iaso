import React, { createRef, FunctionComponent, useCallback } from 'react';

import { Popup } from 'react-leaflet';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';

import {
    makeStyles,
    Card,
    CardContent,
    Button,
    Grid,
    Box,
    Table,
    TableBody,
} from '@material-ui/core';

import { useSafeIntl, mapPopupStyles } from 'bluesquare-components';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';
import { CompletenessMapStats, CompletenessRouterParams } from '../types';

import { PopupRow } from './PopUpRow';

import { redirectTo } from '../../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...mapPopupStyles(theme),
    popup: {
        ...mapPopupStyles(theme).popup,
        '& .leaflet-popup-content': {
            margin: 0,
            minHeight: 100,
            width: '300px !important',
        },
    },
    actionBox: {
        padding: theme.spacing(1, 0, 0, 0),
    },
    titleMessage: {
        fontSize: 16,
        marginBottom: theme.spacing(1),
    },
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
    },
    cell: {
        border: 'none',
    },
}));

type Props = {
    location: CompletenessMapStats;
    params: CompletenessRouterParams;
};

const baseUrl = baseUrls.completenessStats;

export const PopupComponent: FunctionComponent<Props> = ({
    location,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const popup = createRef();
    const handleClick = useCallback(() => {
        const tempParams = {
            ...params,
            parentId: `${location.id}`,
        };
        dispatch(redirectTo(baseUrl, tempParams));
    }, [dispatch, location.id, params]);
    return (
        // @ts-ignore
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            <Card className={classes.popupCard}>
                <CardContent className={classNames(classes.popupCardContent)}>
                    <Table size="small">
                        <TableBody>
                            <PopupRow
                                label={`${
                                    location.org_unit_type?.name ||
                                    formatMessage(MESSAGES.name)
                                }`}
                                value={<LinkToOrgUnit orgUnit={location} />}
                            />

                            {Object.entries(location.form_stats).map(
                                ([key, value]) => (
                                    <Box key={key}>
                                        <PopupRow
                                            label={value.name}
                                            value={`${value.percent.toFixed(
                                                2,
                                            )}%`}
                                        />
                                        <PopupRow
                                            label={formatMessage(
                                                MESSAGES.count,
                                            )}
                                            value={
                                                value.descendants > 0
                                                    ? `${value.descendants_ok}/${value.descendants}`
                                                    : 'N/A'
                                            }
                                        />
                                    </Box>
                                ),
                            )}
                        </TableBody>
                    </Table>
                    <Box className={classes.actionBox}>
                        <Grid
                            container
                            spacing={0}
                            justifyContent="flex-end"
                            alignItems="center"
                        >
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={handleClick}
                            >
                                {formatMessage(MESSAGES.see)}
                            </Button>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </Popup>
    );
};
