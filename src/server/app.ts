import { startApp } from 'modelence/server';
import exampleModule from '@/server/example';
import eggBoilerModule from '@/server/eggBoiler';
import { createDemoUser } from '@/server/migrations/createDemoUser';

startApp({
  modules: [exampleModule, eggBoilerModule],

  migrations: [{
    version: 1,
    description: 'Create demo user',
    handler: createDemoUser,
  }],
});
