import { Hono } from 'hono';
import { optionalAuth } from '@middleware/auth.middleware.js';
import { rateLimitTiers } from '@middleware/rate-limit.middleware.js';
import { countryRegulationController } from '../controller/country-regulation.controller.js';
import type { AppEnv } from '@shared/types/hono-env.js';

/** Mounted at `/countries` — API Specification §4. */
export const countryRoutes = new Hono<AppEnv>();

countryRoutes.get('/', rateLimitTiers.guest, optionalAuth, (c) => countryRegulationController.listCountries(c));
