/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useState } from 'react';
import { Box } from '@material-ui/core';
// @ts-ignore
import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import MESSAGES from '../../../constants/messages';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { MapRoundButton } from './MapRoundButton';

type Props = {
    selection: 'all' | 'latest' | string;
    // eslint-disable-next-line no-unused-vars
    onChange: (value: 'all' | 'latest' | string) => void;
    options: DropdownOptions<'all' | 'latest' | string>[];
    isOpen: boolean;
    closeDialog: () => void;
    id?: string;
};

const MapRoundSelector: FunctionComponent<Props> = ({
    selection,
    onChange,
    options,
    isOpen,
    closeDialog,
    id,
}) => {
    const [radio, setRadio] = useState<string>(selection);

    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={MESSAGES.selectRoundsToDisplay}
            onConfirm={() => {
                onChange(radio);
            }}
            onCancel={() => {
                setRadio(selection);
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            id={id ?? 'editMapRound'}
            dataTestId="editMapRound"
            onClose={() => null}
        >
            <Box display="block">
                <InputComponent
                    type="radio"
                    keyValue="showRound"
                    value={radio}
                    onChange={(_: never, value: string) => setRadio(value)}
                    options={options}
                    labelString=""
                />
            </Box>
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(MapRoundSelector, MapRoundButton);

export { modalWithButton as MapRoundSelector };
