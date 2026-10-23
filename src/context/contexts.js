import { createContext, useContext } from 'react';


export const StateContext = createContext(null);
export const DispatchContext = createContext(null);
export const HistoryContext = createContext(null);
export const ThemeContext = createContext(null);

export const useBoardsState = () => useContext(StateContext);
export const useBoardsDispatch = () => useContext(DispatchContext);
export const useHistory = () => useContext(HistoryContext);
export const useTheme = () => useContext(ThemeContext);
