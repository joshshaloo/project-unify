import { headers } from 'next/headers';
import { createCaller } from './root';
import { createTRPCContext } from './server';

export const api = createCaller(createTRPCContext);