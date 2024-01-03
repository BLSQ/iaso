import React, { FunctionComponent } from 'react';
import { TableCell, TableRow } from '@mui/material';
import { makeStyles } from '@mui/styles';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../forms/messages';
import { LinkValue } from './LinkValue';

const useStyles = makeStyles(theme => ({
    cell: {
        minWidth: 180,
    },
    isDifferent: {
        backgroundColor: theme.palette.secondary.main,
        color: 'white',
    },
    isDifferentValidated: {
        backgroundColor: theme.palette.primary.main,
        color: 'white',
    },
}));

const ignoredKeys = [
    'id',
    'source_id',
    'sub_source_id',
    'org_unit_type_id',
    'has_geo_json',
    'org_unit_type',
    'parent_id',
    'sub_source',
    'source',
];

type Props = {
    linkKey: string;
    value?: any;
    link?: any;
    isDifferent: boolean;
    validated?: boolean;
};

export const LinksValue: FunctionComponent<Props> = ({
    linkKey,
    value = null,
    link = null,
    isDifferent,
    validated = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    if (ignoredKeys.indexOf(linkKey) !== -1) return null;

    const differentClass = validated
        ? classes.isDifferentValidated
        : classes.isDifferent;

    const className = isDifferent ? differentClass : undefined;

    return (
        <TableRow>
            <TableCell className={classes.cell}>
                {MESSAGES[linkKey] && formatMessage(MESSAGES[linkKey])}
                {!MESSAGES[linkKey] && linkKey}
            </TableCell>
            <TableCell className={className}>
                <LinkValue linkKey={linkKey} value={value} link={link} />
            </TableCell>
        </TableRow>
    );
};
