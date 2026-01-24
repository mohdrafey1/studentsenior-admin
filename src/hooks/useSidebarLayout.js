import { useSidebar } from '../context/SidebarContext';

export const useSidebarLayout = () => {
    const { collapsed } = useSidebar();

    // Return dynamic margin based on sidebar state
    const getMainContentMargin = () => {
        return collapsed ? 'md:ml-20' : 'md:ml-72';
    };

    return {
        collapsed,
        mainContentMargin: getMainContentMargin(),
    };
};
