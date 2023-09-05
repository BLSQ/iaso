import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';

type Props = {
    formValue: string;
    // eslint-disable-next-line no-unused-vars
    onChangeDescription: (field: string, value: string) => void;
};

export const VersionDescription: FunctionComponent<Props> = ({
    formValue,
    onChangeDescription,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <InputComponent
            type="text"
            keyValue="versionDescription"
            labelString={formatMessage(MESSAGES.dataSourceDescription)}
            value={formValue}
            onChange={(field, value) => {
                onChangeDescription(field, value);
            }}
        />
    );
};
