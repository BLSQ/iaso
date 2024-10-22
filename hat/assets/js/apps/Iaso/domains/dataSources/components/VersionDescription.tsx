import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';

type Props = {
    formValue: string;
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
