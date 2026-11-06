//
import Fab from './Fab.js';
import Card from './Card.js';
import Chip from './Chip.jsx';
import Tabs from './Tabs.js';
import Menu from './Menu.js';
import Link from './Link.js';
import Lists from './List.js';
import Table from './Table.js';
import Alert from './Alert.jsx';
import Badge from './Badge.js';
import Paper from './Paper.js';
import Input from './Input.js';
import Radio from './Radio.js';
import Drawer from './Drawer.js';
import Dialog from './Dialog.js';
import Avatar from './Avatar.js';
import Rating from './Rating.jsx';
import Slider from './Slider.js';
import Button from './Button.js';
import Switch from './Switch.js';
import Select from './Select.js';
import SvgIcon from './SvgIcon.js';
import Tooltip from './Tooltip.js';
import Popover from './Popover.js';
import Stepper from './Stepper.js';
import DataGrid from './DataGrid.js';
import Skeleton from './Skeleton.js';
import Backdrop from './Backdrop.js';
import Progress from './Progress.js';
import Timeline from './Timeline.js';
import TreeView from './TreeView.jsx';
import Checkbox from './Checkbox.jsx';
import Accordion from './Accordion.js';
import Typography from './Typography.js';
import Pagination from './Pagination.js';
import Breadcrumbs from './Breadcrumbs.js';
import ButtonGroup from './ButtonGroup.js';
import CssBaseline from './CssBaseline.js';
import Autocomplete from './Autocomplete.js';
import ToggleButton from './ToggleButton.js';
import ControlLabel from './ControlLabel.js';
import LoadingButton from './LoadingButton.js';

// ----------------------------------------------------------------------

export default function ComponentsOverrides(theme) {
  return Object.assign(
    Fab(theme),
    Tabs(theme),
    Chip(theme),
    Card(theme),
    Menu(theme),
    Link(theme),
    Input(theme),
    Radio(theme),
    Badge(theme),
    Lists(theme),
    Table(theme),
    Paper(theme),
    Alert(theme),
    Switch(theme),
    Select(theme),
    Button(theme),
    Rating(theme),
    Dialog(theme),
    Avatar(theme),
    Slider(theme),
    Drawer(theme),
    Stepper(theme),
    Tooltip(theme),
    Popover(theme),
    SvgIcon(theme),
    Checkbox(theme),
    DataGrid(theme),
    Skeleton(theme),
    Timeline(theme),
    TreeView(theme),
    Backdrop(theme),
    Progress(theme),
    Accordion(theme),
    Typography(theme),
    Pagination(theme),
    ButtonGroup(theme),
    Breadcrumbs(theme),
    CssBaseline(theme),
    Autocomplete(theme),
    ControlLabel(theme),
    ToggleButton(theme),
    LoadingButton(theme)
  );
}
