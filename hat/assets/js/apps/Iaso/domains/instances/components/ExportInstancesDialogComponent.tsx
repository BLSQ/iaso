import React, { FunctionComponent } from 'react';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { createExportRequest } from '../actions';
import MESSAGES from '../messages';

type Props = {
    getFilters: () => any;
    renderTrigger: (openDialog: () => void) => React.JSX.Element;
    selection?: Record<string, any>;
};

const ExportInstancesDialogComponent: FunctionComponent<Props> = ({
    getFilters,
    renderTrigger,
    selection,
}) => {
    const [forceExport, setForceExport] = React.useState(false);
    const onConfirm = closeDialog => {
        const filterParams = getFilters();
        createExportRequest({ forceExport, ...filterParams }, selection).then(
            () => closeDialog(),
        );
    };
    const onClosed = () => {
        setForceExport(false);
    };
    let title = MESSAGES.export;
    if (selection) {
        title = {
            ...MESSAGES.exportSelection,
            values: {
                count: selection.selectCount,
            },
        };
    }
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => renderTrigger(openDialog)}
            titleMessage={title}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.export}
            onClosed={onClosed}
            cancelMessage={MESSAGES.cancel}
            maxWidth="xs"
        >
            <p />
            <InputComponent
                clearable
                keyValue="algoId"
                onChange={() => setForceExport(!forceExport)}
                value={forceExport}
                type="checkbox"
                label={MESSAGES.forceExport}
            />
        </ConfirmCancelDialogComponent>
    );
};

export default ExportInstancesDialogComponent;
