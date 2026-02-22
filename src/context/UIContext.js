import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    // Level 1: Standard, Level 2: Large, Level 3: Extra Large
    const [fontSizeLevel, setFontSizeLevel] = useState(1);

    const toggleFontSize = () => {
        setFontSizeLevel(prev => (prev >= 3 ? 1 : prev + 1));
    };

    return (
        <UIContext.Provider value={{ fontSizeLevel, toggleFontSize }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
