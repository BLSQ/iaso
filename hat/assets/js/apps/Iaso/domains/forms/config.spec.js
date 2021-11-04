import { IconButton } from 'bluesquare-components';
import formsTableColumns, { formVersionsTableColumns } from './config';
import archivedTableColumn from './configArchived';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import FormVersionsDialog from './components/FormVersionsDialogComponent';

import formsFixture from './fixtures/forms.json';
import formVersionsfixture from './fixtures/formVersions.json';

import { colOriginal } from '../../../../test/utils';

const defaultProps = {
    state: {
        currentOrgUnit: undefined,
    },
    setState: () => null,
    deleteForm: () => null,
};

let columns;
let formVersionscolumns;
const fakeForm = formsFixture.forms[0];
const fakeFormVersion = formVersionsfixture.form_versions[0];
let wrapper;
let xlsButton;
let actionColumn;
let formVersionsDialog;
let deleteDialog;
let deleteFormSpy;
let restoreFormSpy;
let restoreIcon;
const setForceRefreshSpy = sinon.spy();

describe('Forms config', () => {
    describe('formVersionsTableColumns', () => {
        it('sould return an array of 4 columns', () => {
            formVersionscolumns = formVersionsTableColumns(
                () => null,
                () => setForceRefreshSpy(),
            );
            expect(formVersionscolumns).to.have.lengthOf(4);
        });
        it('should render a component if Cell is defined', () => {
            formVersionscolumns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(fakeFormVersion));
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if Cell is defined and missing start_period, end_period and version_id', () => {
            formVersionscolumns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(
                        colOriginal(formVersionsfixture.form_versions[1]),
                    );
                    expect(cell).to.exist;
                }
            });
        });
        it('should open a tab on click on xls icon', () => {
            actionColumn = formVersionscolumns[formVersionscolumns.length - 1];
            wrapper = shallow(actionColumn.Cell(colOriginal(fakeFormVersion)));
            xlsButton = wrapper.find(IconButton);

            expect(xlsButton).to.have.lengthOf(1);
            const openStub = sinon.stub(window, 'open');
            xlsButton.props().onClick();
            expect(openStub).to.have.been.called;
            sinon.restore();
        });
        it('should render IconButtonComponent', () => {
            formVersionsDialog = wrapper.find(FormVersionsDialog);
            expect(formVersionsDialog).to.have.lengthOf(1);
            const iconButtonComponent = shallow(
                formVersionsDialog.props().renderTrigger({ openDialog: null }),
            );

            expect(iconButtonComponent).to.have.lengthOf(1);
        });
        it('should trigger setForceRefresh on onConfirmed', () => {
            formVersionsDialog.props().onConfirmed();
            expect(setForceRefreshSpy.calledOnce).to.equal(true);
        });
    });
    describe('formsTableColumns', () => {
        it('sould return an array of 9 columns', () => {
            columns = formsTableColumns(() => null, defaultProps);
            expect(columns).to.have.lengthOf(9);
        });
        it('should render a component if Cell is defined', () => {
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(fakeForm));
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if Cell is defined and no from id', () => {
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(
                        colOriginal({
                            ...fakeForm,
                            form_id: 0,
                        }),
                    );
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if value not present and Cell is defined', () => {
            const tempForm = { ...fakeForm };
            delete tempForm.instance_updated_at;
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(tempForm));
                    expect(cell).to.exist;
                }
            });
        });
        describe('action colmumn', () => {
            it('should only display eye icon button if instances_count = 0,showEditAction = false, showMappingAction = false', () => {
                const tempForm = { ...fakeForm };

                deleteFormSpy = sinon.spy();
                columns = formsTableColumns(
                    () => null,
                    defaultProps,
                    false,
                    false,
                    () => {
                        deleteFormSpy();
                        return new Promise(resolve => resolve());
                    },
                );
                tempForm.instances_count = 0;
                actionColumn = columns[columns.length - 1];
                wrapper = shallow(actionColumn.Cell(colOriginal(tempForm)));

                const redEyeIcon = wrapper.find('[icon="remove-red-eye"]');
                expect(redEyeIcon).to.have.lengthOf(1);
                const editIcon = wrapper.find('[icon="edit"]');
                expect(editIcon).to.have.lengthOf(0);
                const dhisIcon = wrapper.find('[icon="dhis"]');
                expect(dhisIcon).to.have.lengthOf(0);
                expect(wrapper.find(IconButton)).to.have.lengthOf(1);
            });
            it('should trigger deleteFormSpy on onConfirm', () => {
                deleteDialog = wrapper.find(DeleteDialog);
                expect(deleteDialog).to.have.lengthOf(1);
                deleteDialog.props().onConfirm();
                expect(deleteFormSpy.calledOnce).to.equal(true);
            });
            it('should change url if currentOrg unit is defined and display red eye icon', () => {
                const tempForm = { ...fakeForm };
                tempForm.instances_count = 5;
                columns = formsTableColumns(
                    () => null,
                    { ...defaultProps, state: { currentOrgUnit: { id: 1 } } },
                    false,
                    false,
                );
                actionColumn = columns[columns.length - 1];
                wrapper = shallow(actionColumn.Cell(colOriginal(tempForm)));
                const redEyeIcon = wrapper.find('[icon="remove-red-eye"]');
                expect(redEyeIcon.prop('url')).to.equal(
                    'forms/submissions/formIds/69/tab/list/columns/updated_at,org_unit__name,created_at,status/levels/1',
                );
                expect(redEyeIcon).to.have.lengthOf(1);
            });
        });
    });

    describe('archivedTableColumn', () => {
        it('sould return an array of 9 columns', () => {
            restoreFormSpy = sinon.spy();
            columns = archivedTableColumn(
                () => null,
                () => restoreFormSpy(),
            );
            expect(columns).to.have.lengthOf(9);
        });
        it('should render a component if Cell is defined', () => {
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(fakeForm));
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if Cell is defined and no form id', () => {
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(fakeForm));
                    expect(cell).to.exist;
                }
            });
        });
        it('should render a component if value not present and Cell is defined', () => {
            const tempForm = { ...fakeForm };
            delete tempForm.instance_updated_at;
            columns.forEach(c => {
                if (c.Cell) {
                    const cell = c.Cell(colOriginal(tempForm));
                    expect(cell).to.exist;
                }
            });
        });
        describe('action colmumn', () => {
            it('should render restore icon', () => {
                actionColumn = columns[columns.length - 1];
                wrapper = shallow(actionColumn.Cell(colOriginal(fakeForm)));
                restoreIcon = wrapper.find('[icon="restore-from-trash"]');
                expect(restoreIcon).to.have.lengthOf(1);
            });
            it('should trigger restoreForm on onConfirm', () => {
                restoreIcon.props().onClick();
                expect(restoreFormSpy.calledOnce).to.equal(true);
            });
        });
    });
});
