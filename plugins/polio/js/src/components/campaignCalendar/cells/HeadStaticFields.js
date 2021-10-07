import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { useKeyPressListener } from 'bluesquare-components';

import { TableCell, TableSortLabel } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';

import { colSpanTitle, staticFields } from '../constants';
import { getOrderArray, getSort } from '../utils';
import { useStyles } from '../Styles';
import MESSAGES from '../../../constants/messages';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';

const HeadStaticFieldsCells = ({ orders, params }) => {
    const classes = useStyles();
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
        dispatch(redirectTo('polio/calendar', newParams));
    };
    return staticFields.map(f => {
        const sort = ordersArray.find(o => o.id === f.sortKey);
        const sortActive = Boolean(sort);
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
                        direction={sortActive && !sort.desc ? 'asc' : 'desc'}
                        title="title"
                        classes={{
                            root: classes.sortLabel,
                            icon: classes.icon,
                        }}
                    >
                        <FormattedMessage {...MESSAGES[f.key]} />
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
