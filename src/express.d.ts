import { AuthUser } from './auth/jwt.strategy';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
