import { useSQLiteContext } from 'expo-sqlite';
import { createContext, use, useMemo, type PropsWithChildren } from 'react';

import { createContainer, type Container } from './container';

const ContainerContext = createContext<Container | null>(null);

/** Must be rendered inside <SQLiteProvider>. */
export function ContainerProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const container = useMemo(() => createContainer(db), [db]);
  return <ContainerContext value={container}>{children}</ContainerContext>;
}

export function useContainer(): Container {
  const container = use(ContainerContext);
  if (!container) throw new Error('useContainer must be used inside <ContainerProvider>');
  return container;
}
