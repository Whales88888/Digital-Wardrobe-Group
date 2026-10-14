import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  function createContext(method: string, header?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          header: (name: string) => name === 'x-wardrobe-request' ? header : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows safe methods without a CSRF header', () => {
    expect(guard.canActivate(createContext('GET'))).toBe(true);
  });

  it('requires the custom header for state-changing requests', () => {
    expect(() => guard.canActivate(createContext('POST'))).toThrow(
      ForbiddenException,
    );
    expect(guard.canActivate(createContext('POST', '1'))).toBe(true);
  });
});
