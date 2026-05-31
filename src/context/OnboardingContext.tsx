import React, { createContext, useContext, useState } from 'react';

interface OnboardingContextValue {
  name: string;
  setName: (v: string) => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  name: '',
  setName: () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState('');

  return (
    <OnboardingContext.Provider value={{ name, setName }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
