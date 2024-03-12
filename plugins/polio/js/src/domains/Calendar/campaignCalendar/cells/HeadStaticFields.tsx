import React, { FunctionComponent } from 'react';

import classnames from 'classnames';
import { useDispatch } from 'react-redux';

import {
    useKeyPressListener,
    useSafeIntl,
    getOrderArray,
    getSort,
} from 'bluesquare-components';

import { TableCell, TableSortLabel, Box } from '@mui/material';

import { replace } from 'react-router-redux';
import { withRouter } from 'react-router';
import { colSpanTitle, defaultStaticColWidth } from '../constants';
import { useStyles } from '../Styles';
import MESSAGES from '../../../../constants/messages';
import { genUrl } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { useStaticFields } from '../../hooks/useStaticFields';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { Field } from '../../types';

type Props = {
    orders: string;
    router: Router; 
    isPdf: boolean;
};

type Order = {
    id: string;
    desc: boolean;
};

const HeadStaticFieldsCells: FunctionComponent<Props> = ({ orders, router, isPdf }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const shiftKeyIsDown = useKeyPressListener('Shift');
    const ordersArray = getOrderArray(orders);
    const handleSort = (field: Field, existingSort: Order) => {
        let desc = true;
        if (existingSort && existingSort.desc) {
            desc = false;
        }
        const currentSort = field.sortKey && {
            desc,
            id: field.sortKey,
        };
        let newSort: Order[] = []; 
        if (shiftKeyIsDown) {
            newSort = [
                ...ordersArray.filter(
                    o => o.id !== field.sortKey && shiftKeyIsDown,
                ),
            ];
        }
        if (currentSort) {
            newSort.push(currentSort);
        }

        const url = genUrl(router, {
            order: getSort(newSort),
        });

        dispatch(replace(url));
    };
    const fields = useStaticFields(isPdf);
    return (<>{fields.map(f => {
        const sort = ordersArray.find(o => o.id === f.sortKey);
        const sortActive = Boolean(sort);
        const direction = sortActive && !sort.desc ? 'asc' : 'desc';
        let title = MESSAGES.sortDesc;
        if (sortActive) {
            if (sort?.desc) {
                title = MESSAGES.sortAsc;
            }
        }
        return (
            <TableCell
                key={f.key}
                className={classnames(
                    classes.tableCellTitle,
                )}
                colSpan={colSpanTitle}
                style={{
                    top: 100,
                    width: f.width || defaultStaticColWidth,
                    minWidth: f.width || defaultStaticColWidth,
                }}
            >
                <Box position="relative" width="100%" height="100%">
                    {f.sortKey && (
                        <span
                            onClick={() => handleSort(f, sort)}
                            role="button"
                            tabIndex={0}
                            className={classnames(
                                classes.tableCellSpan,
                                classes.tableCellSpanTitle,
                            )}
                        >
                            <TableSortLabel
                                active={sortActive}
                                direction={direction}
                                title={formatMessage(title)}
                            >
                                {formatMessage(MESSAGES[f.key])}
                            </TableSortLabel>
                        </span>
                    )}
                    {!f.sortKey &&
                        !f.hideHeadTitle &&
                        formatMessage(MESSAGES[f.key])}
                </Box>
            </TableCell>
        );
    })
    }</>);
};

const wrappedHeadStaticFieldsCells = withRouter(HeadStaticFieldsCells);
export { wrappedHeadStaticFieldsCells as HeadStaticFieldsCells };
