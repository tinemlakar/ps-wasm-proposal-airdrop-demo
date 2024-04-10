import { Application } from 'express';
import { NextFunction, Request, Response } from '../http';
import { AuthenticateAdmin } from '../middlewares/authentication';
import { ValidationError } from '../lib/errors';
import { User } from '../models/user';

/**
 * Installs new route on the provided application.
 * @param app ExpressJS application.
 */
export function inject(app: Application) {
  app.post(
    '/users/confirm',
    AuthenticateAdmin,
    (req: Request, res: Response, next: NextFunction) => {
      resolve(req, res).catch(next);
    },
  );
}

export async function resolve(req: Request, res: Response): Promise<void> {
  const { context } = req;

  const user = new User(null, context);
  await user.confirmAll();

  return res.respond(200, { success: 'ok' });
}
