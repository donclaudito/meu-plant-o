import Deposits from './pages/Deposits';
import Doctors from './pages/Doctors';
import Finance from './pages/Finance';
import Hospitals from './pages/Hospitals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Shifts from './pages/Shifts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Deposits": Deposits,
    "Doctors": Doctors,
    "Finance": Finance,
    "Hospitals": Hospitals,
    "Reports": Reports,
    "Settings": Settings,
    "Shifts": Shifts,
}

export const pagesConfig = {
    mainPage: "Shifts",
    Pages: PAGES,
    Layout: __Layout,
};