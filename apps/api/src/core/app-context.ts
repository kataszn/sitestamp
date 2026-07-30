import { PrismaClient } from '@prisma/client';
import { VisitRepository } from '../features/visit/repo';

export interface AppContext {
  repo: AppRepo;
}

export interface AppRepo {
  visit: VisitRepository; 
}

let _appContext: AppContext | null = null;

export function getAppContext(): AppContext {
  if (!_appContext) {
    throw new Error("App context not initialized.");
  }
  return _appContext;
}

export function createAppContext(db: PrismaClient): AppContext {
  const repos = {
    visit: new VisitRepository(db),
  };

  _appContext = {
    repo: repos,
  };

  return _appContext;
}

export const CTX = new Proxy({} as AppContext, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string") {
      return undefined;
    }
    return getAppContext()[prop as keyof AppContext];
  },
});