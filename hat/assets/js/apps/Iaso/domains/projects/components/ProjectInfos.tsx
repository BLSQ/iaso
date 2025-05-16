import React, { FunctionComponent } from 'react';

import { Box } from '@mui/material';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { chipColors } from 'Iaso/constants/chipColors';
import { SxStyles } from 'Iaso/types/general';
import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';

type Form = {
    value: string | undefined;
    errors: Array<string>;
};

export type ProjectForm = {
    id?: Form;
    app_id: Form;
    name: Form;
    feature_flags: {
        value: Array<string | number> | undefined;
        errors: Array<string>;
    };
    qr_code: Form;
    color: Form;
};

type Props = {
    setFieldValue: (key: string, value: string) => void;
    currentProject: ProjectForm;
};
const styles: SxStyles = {
    qrCodeLarge: {
        width: 300,
        height: 300,
    },
    qrCodeContainer: {
        display: 'flex',
        justifyContent: 'center',
        pt: 2,
        pb: 2,
    },
};
const ProjectInfos: FunctionComponent<Props> = ({
    setFieldValue,
    currentProject,
}) => {
    return (
        <>
            <InputComponent
                keyValue="name"
                onChange={(key, value) => setFieldValue(key, value)}
                value={currentProject.name.value}
                errors={currentProject.name.errors}
                type="text"
                label={MESSAGES.projectName}
                required
            />
            <InputComponent
                keyValue="app_id"
                onChange={(key, value) => setFieldValue(key, value)}
                value={currentProject.app_id.value}
                errors={currentProject.app_id.errors}
                type="text"
                label={MESSAGES.appId}
                required
            />
            <Box mt={2}>
                <ColorPicker
                    currentColor={currentProject.color.value ?? ''}
                    onChangeColor={color => setFieldValue('color', color)}
                    colors={[...chipColors, '#1976D2']}
                />
            </Box>
            {currentProject.qr_code.value && (
                <Box sx={styles.qrCodeContainer}>
                    <Box
                        component="img"
                        src={currentProject.qr_code.value}
                        sx={styles.qrCodeLarge}
                        alt="QR Code Large"
                    />
                </Box>
            )}
        </>
    );
};

export { ProjectInfos };
