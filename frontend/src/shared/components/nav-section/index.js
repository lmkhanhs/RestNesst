import { matchPath } from 'react-router-dom';

// ----------------------------------------------------------------------

export { default as NavSectionVertical } from '@/shared/components/nav-section/vertical/index.jsx';
export { default as NavSectionHorizontal } from '@/shared/components/nav-section/horizontal/index.jsx';

export function isExternalLink(path) {
  return path?.includes('http');
}

export function getActive(path, pathname) {
  return path ? !!matchPath({ path, end: false }, pathname) : false;
}
