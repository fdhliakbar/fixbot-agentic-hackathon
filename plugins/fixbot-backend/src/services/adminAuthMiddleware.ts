/**
 * Admin authentication middleware for FixBot
 * Protects Swagger docs and admin-only endpoints
 */
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import Knex from 'knex';

export interface AdminAuthMiddlewareOptions {
  knex: Knex.Knex;
}

export function createAdminAuthMiddleware(options: AdminAuthMiddlewareOptions) {
  const { knex } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="FixBot Admin"');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Decode base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      res.setHeader('WWW-Authenticate', 'Basic realm="FixBot Admin"');
      return res.status(401).json({ error: 'Invalid credentials format' });
    }

    try {
      // Query admin user from database
      const adminUser = await knex('fixbot_admin_users')
        .where({ username })
        .first();

      if (!adminUser) {
        res.setHeader('WWW-Authenticate', 'Basic realm="FixBot Admin"');
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);

      if (!isValidPassword) {
        res.setHeader('WWW-Authenticate', 'Basic realm="FixBot Admin"');
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Update last login time
      await knex('fixbot_admin_users')
        .where({ username })
        .update({ last_login: knex.fn.now() });

      // Authentication successful, proceed to next middleware
      return next();
    } catch (error) {
      console.error('Admin authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
}
