import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { AuthSanitizeUserInterceptor } from './auth-sanitize-user.interceptor';

describe('AuthSanitizeUserInterceptor', () => {
  let interceptor: AuthSanitizeUserInterceptor;

  beforeEach(() => {
    interceptor = new AuthSanitizeUserInterceptor();
  });

  const executeIntercept = async (payload: unknown) => {
    const context = {} as ExecutionContext;
    const next: CallHandler = {
      handle: () => of(payload),
    };

    return lastValueFrom(interceptor.intercept(context, next));
  };

  it('removes passwordHash from flat user object', async () => {
    const result = await executeIntercept({
      id: '1',
      username: 'alice',
      passwordHash: 'secret',
    });

    expect(result).toEqual({
      id: '1',
      username: 'alice',
    });
  });

  it('removes passwordHash from nested response payload', async () => {
    const result = await executeIntercept({
      message: 'Login successful',
      user: {
        id: '1',
        username: 'alice',
        passwordHash: 'secret',
      },
      permissions: ['users.read'],
    });

    expect(result).toEqual({
      message: 'Login successful',
      user: {
        id: '1',
        username: 'alice',
      },
      permissions: ['users.read'],
    });
  });

  it('removes passwordHash from arrays and deep nested structures', async () => {
    const result = await executeIntercept({
      users: [
        {
          id: '1',
          username: 'alice',
          passwordHash: 'secret-1',
        },
        {
          id: '2',
          username: 'bob',
          roles: [
            {
              code: 'admin',
              users: [
                {
                  id: '3',
                  username: 'charlie',
                  passwordHash: 'secret-3',
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      users: [
        {
          id: '1',
          username: 'alice',
        },
        {
          id: '2',
          username: 'bob',
          roles: [
            {
              code: 'admin',
              users: [
                {
                  id: '3',
                  username: 'charlie',
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
