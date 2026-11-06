import { useContext } from 'react';
import { CollapseDrawerContext } from '@/shared/contexts/CollapseDrawerContext.jsx';

// ----------------------------------------------------------------------

const useCollapseDrawer = () => useContext(CollapseDrawerContext);

export default useCollapseDrawer;
