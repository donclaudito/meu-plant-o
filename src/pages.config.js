import Shifts from './pages/Shifts';
import Finance from './pages/Finance';
import Doctors from './pages/Doctors';
import Hospitals from './pages/Hospitals';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Shifts": Shifts,
    "Finance": Finance,
    "Doctors": Doctors,
    "Hospitals": Hospitals,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Shifts",
    Pages: PAGES,
    Layout: __Layout,
};