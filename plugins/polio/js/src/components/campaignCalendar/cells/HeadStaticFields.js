import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { useKeyPressListener, useSafeIntl } from 'bluesquare-components';

import { TableCell, TableSortLabel } from '@material-ui/core';

import { colSpanTitle, staticFields } from '../constants';
import { getOrderArray, getSort } from '../utils';
import { useStyles } from '../Styles';
import MESSAGES from '../../../constants/messages';
import { CALENDAR_BASE_URL } from '../../../constants/routes';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';

const HeadStaticFieldsCells = ({ orders, params }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const shiftKeyIsDown = useKeyPressListener('Shift');
    const ordersArray = getOrderArray(orders);
    const handleSort = (field, existingSort) => {
        let desc = true;
        if (existingSort && existingSort.desc) {
            desc = false;
        }
        const currentSort = {
            desc,
            id: field.sortKey,
        };
        let newSort = [];
        if (shiftKeyIsDown) {
            newSort = [
                ...ordersArray.filter(
                    o => o.id !== field.sortKey && shiftKeyIsDown,
                ),
            ];
        }
        newSort.push(currentSort);
        const newParams = {
            ...params,
            order: getSort(newSort),
        };
        dispatch(redirectTo(CALENDAR_BASE_URL, newParams));
    };
    return staticFields.map(f => {
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
                    classes.tableCellTitleLarge,
                )}
                colSpan={colSpanTitle}
                style={{ top: 100 }}
            >
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
                        classes={{
                            root: classes.sortLabel,
                            icon: classes.icon,
                        }}
                    >
                        {formatMessage(MESSAGES[f.key])}
                    </TableSortLabel>
                </span>
            </TableCell>
        );
    });
};

HeadStaticFieldsCells.propTypes = {
    orders: PropTypes.string.isRequired,
    params: PropTypes.object.isRequired,
};

export { HeadStaticFieldsCells };
