import React, { FunctionComponent, useState, useCallback } from 'react';
import { Box, Button, DialogActions, Divider } from '@material-ui/core';

import {
    // @ts-ignore
    QueryBuilder,
    // @ts-ignore
    QueryFields,
    // @ts-ignore
    QueryJsonLogicTree,
    // @ts-ignore
    FakeInput,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';

import { IntlMessage } from '../../../types/intl';
import DialogComponent from '../../dialogs/DialogComponent';
import MESSAGES from './messages';

const staticLogic = {
    and: [
        { '==': [{ var: 'datetime' }, '2002-10-22T20:22:00.000Z'] },
        { '>': [{ var: 'price' }, 47] },
    ],
};
const fields: QueryFields = {
    datetime: {
        label: 'DateTime',
        type: 'datetime',
        valueSources: ['value'],
    },
    price: {
        label: 'Price',
        type: 'number',
        valueSources: ['value'],
        fieldSettings: {
            min: 10,
            max: 100,
        },
        preferWidgets: ['slider', 'rangeslider'],
    },
    color: {
        label: 'Color',
        type: 'select',
        valueSources: ['value'],
        fieldSettings: {
            listValues: [
                { value: 'yellow', title: 'Yellow' },
                { value: 'green', title: 'Green' },
                { value: 'orange', title: 'Orange' },
            ],
        },
    },
    is_promotion: {
        label: 'Promo?',
        type: 'boolean',
        operators: ['equal'],
        valueSources: ['value'],
    },
};

type Props = {
    label: IntlMessage;
};

const CloseDialog = ({
    onCancel,
    closeDialog,
    buttonMessage = MESSAGES.close,
}) => {
    return (
        <DialogActions style={{ paddingBottom: '20px', paddingRight: '20px' }}>
            <Button
                onClick={() => onCancel(closeDialog)}
                color="primary"
                data-test="close-button"
            >
                <FormattedMessage {...buttonMessage} />
            </Button>
        </DialogActions>
    );
};

const onClose = closeDialog => {
    closeDialog();
};
const makeRenderTrigger =
    (label: string, value?: string) =>
    ({ openDialog }) =>
        (
            <FakeInput
                onClick={openDialog}
                value={value}
                dataTestId="open-query-builder"
                label={label}
            />
        );

export const QueryBuilderField: FunctionComponent<Props> = ({
    label = MESSAGES.title,
}) => {
    const { formatMessage } = useSafeIntl();
    const [logic, setLogic] = useState<QueryJsonLogicTree>(staticLogic);
    const renderTrigger = useCallback(
        () => makeRenderTrigger(formatMessage(label), JSON.stringify(logic)),
        [formatMessage, logic, label],
    );
    // console.log(
    //     'encodeURIComponent',
    //     encodeURIComponent(JSON.stringify(logic)),
    // );
    const onChange = (jsonLogic: QueryJsonLogicTree) => {
        setLogic(jsonLogic.logic);
    };
    return (
        <DialogComponent
            maxWidth="md"
            dataTestId="query-builder"
            id="query-builder"
            renderActions={({ closeDialog }) => {
                return (
                    <CloseDialog closeDialog={closeDialog} onCancel={onClose} />
                );
            }}
            renderTrigger={renderTrigger()}
            titleMessage={label}
        >
            <Divider />
            <Box mt={2}>
                <Box ml={-4} mr={-4}>
                    <QueryBuilder
                        logic={logic}
                        fields={fields}
                        onChange={onChange}
                    />
                </Box>
                <div className="query-builder-result">
                    <div>
                        <textarea
                            style={{ width: '100%', minHeight: '200px' }}
                            onChange={e => {
                                setLogic(JSON.parse(e.target.value));
                            }}
                            // className={classes.textarea}
                            value={JSON.stringify(logic)}
                        />
                    </div>
                </div>
            </Box>
        </DialogComponent>
    );
};
