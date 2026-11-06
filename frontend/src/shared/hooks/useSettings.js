import { useContext } from 'react';
import { SettingsContext } from '@/shared/contexts/SettingsContext.jsx';

// ----------------------------------------------------------------------

const useSettings = () => useContext(SettingsContext);

export default useSettings;
