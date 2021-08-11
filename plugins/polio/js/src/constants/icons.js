import DataSourceIcon from '@material-ui/icons/ListAltTwoTone';
import Link from '@material-ui/icons/Link';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import CompareArrows from '@material-ui/icons/CompareArrows';
import SupervisorAccount from '@material-ui/icons/SupervisorAccount';
import PhonelinkSetupIcon from '@material-ui/icons/PhonelinkSetup';
import DnsRoundedIcon from '@material-ui/icons/DnsRounded';
import DoneAll from '@material-ui/icons/DoneAll';
import Delete from '@material-ui/icons/Delete';
import Settings from '@material-ui/icons/Settings';
import GroupWork from '@material-ui/icons/GroupWork';
import CategoryIcon from '@material-ui/icons/Category';
import AssignmentRoundedIcon from '@material-ui/icons/AssignmentRounded';
import ImportantDevicesRoundedIcon from '@material-ui/icons/ImportantDevicesRounded';
import BookIcon from '@material-ui/icons/Book';

import DHIS2Svg from '../components/svg/DHIS2SvgComponent';
import OrgUnitSvg from '../components/svg/OrgUnitSvgComponent';

export const icons = {
    forms: props => <DataSourceIcon {...props} />,
    list: props => <FormatListBulleted {...props} />,
    mappings: props => <DHIS2Svg {...props} />,
    completeness: props => <DoneAll {...props} />,
    archived: props => <Delete {...props} />,
    orgunits: props => <OrgUnitSvg {...props} />,
    groups: props => <GroupWork {...props} />,
    types: props => <CategoryIcon {...props} />,
    sources: props => <DnsRoundedIcon {...props} />,
    links: props => <Link {...props} />,
    runs: props => <CompareArrows {...props} />,
    settings: props => <Settings {...props} />,
    tasks: props => <AssignmentRoundedIcon {...props} />,
    devices: props => <ImportantDevicesRoundedIcon {...props} />,
    projects: props => <PhonelinkSetupIcon {...props} />,
    users: props => <SupervisorAccount {...props} />,
    book: props => <BookIcon {...props} />,
};
