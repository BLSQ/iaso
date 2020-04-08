import React from "react";
import { displayDateFromTimestamp } from "../../utils/intlUtil";
import ViewRowButtonComponent from '../../components/buttons/ViewRowButtonComponent';
import MESSAGES from './messages';

const mappingsTableColumns = (formatMessage, component)  => [
  {
    Header: formatMessage(MESSAGES.actions),
    accessor: "actions",
    resizable: false,
    sortable: false,
    width: 150,
    Cell: (settings) => (
      <section>
        <ViewRowButtonComponent onClick={() => component.selectInstance(settings.original)} />

      </section>
    ),
  },
  {
    Header: formatMessage({
      defaultMessage: "Name",
      id: "iaso.label.name",
    }),
    accessor: "form_version__form__name",
    Cell: (settings) => <span>{settings.original.form_version.form.name}</span>,
  },
  {
    Header: formatMessage({
      defaultMessage: "Version",
      id: "iaso.label.version",
    }),
    accessor: "form_version__version_id",
    Cell: (settings) => (
      <span>{settings.original.form_version.version_id}</span>
    ),
  },
  {
    Header: formatMessage({
      defaultMessage: "Type",
      id: "iaso.label.type",
    }),
    accessor: "mapping__mapping_type",
    Cell: (settings) => <span>{settings.original.mapping.mapping_type}</span>,
  },
  {
    Header: formatMessage({
      defaultMessage: "Mapped questions",
      id: "iaso.label.mapped_questions",
    }),
    accessor: "mapped_questions",
    Cell: (settings) => <span>{settings.original.mapped_questions}</span>,
  },
  {
    Header: formatMessage({
      defaultMessage: "Updated at",
      id: "iaso.label.updated_at",
    }),
    accessor: "updated_at",
    Cell: (settings) => (
      <span>{displayDateFromTimestamp(settings.original.updated_at)}</span>
    ),
  },
];
export default mappingsTableColumns;
