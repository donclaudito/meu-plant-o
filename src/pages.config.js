import Finance from './pages/Finance';
import Shifts from './pages/Shifts';
import Doctors from './pages/Doctors';
import Hospitals from './pages/Hospitals';
import Settings from './pages/Settings';
import Deposits from './pages/Deposits';
import Reports from './pages/Reports';
import Permissions from './pages/Permissions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Finance": Finance,
    "Shifts": Shifts,
    "Doctors": Doctors,
    "Hospitals": Hospitals,
    "Settings": Settings,
    "Deposits": Deposits,
    "Reports": Reports,
    "Permissions": Permissions,
}

export const pagesConfig = {
    mainPage: "Shifts",
    Pages: PAGES,
    Layout: __Layout,
};