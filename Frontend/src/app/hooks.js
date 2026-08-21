import { useDispatch, useSelector } from 'react-redux';

/**
 * Typed Redux hooks — use these throughout the app instead of plain
 * useDispatch / useSelector so types flow correctly when TypeScript is added.
 */
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);
