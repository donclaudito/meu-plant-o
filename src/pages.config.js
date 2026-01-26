import Deposits from './pages/Deposits';
import Finance from './pages/Finance';
import Hospitals from './pages/Hospitals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Doctors from './pages/Doctors';
import Shifts from './pages/Shifts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Deposits": Deposits,
    "Finance": Finance,
    "Hospitals": Hospitals,
    "Reports": Reports,
    "Settings": Settings,
    "Doctors": Doctors,
    "Shifts": Shifts,
}

export const pagesConfig = {
    mainPage: "Shifts",
    Pages: PAGES,
    Layout: __Layout,
};