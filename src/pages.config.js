import Deposits from './pages/Deposits';
import Doctors from './pages/Doctors';
import Finance from './pages/Finance';
import Hospitals from './pages/Hospitals';
import Settings from './pages/Settings';
import Shifts from './pages/Shifts';
import Reports from './pages/Reports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Deposits": Deposits,
    "Doctors": Doctors,
    "Finance": Finance,
    "Hospitals": Hospitals,
    "Settings": Settings,
    "Shifts": Shifts,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "Shifts",
    Pages: PAGES,
    Layout: __Layout,
};