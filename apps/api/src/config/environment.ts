import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_HOST: z.string().min(1).default('localhost'),
    DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    DATABASE_NAME: z.string().min(1).default('sa_hall'),
    DATABASE_USER: z.string().min(1).default('sa_hall'),
    DATABASE_PASSWORD: z.string().min(1).default('sa_hall'),
    DATABASE_SSL: z.enum(['true', 'false']).default('false'),
    DATABASE_POOL_MAX: z.coerce.number().int().min(2).max(50).default(10),
    CORS_ORIGINS: z.string().min(1).default('http://localhost:4200'),
  })
  .superRefine((environment, context) => {
    if (
      environment.NODE_ENV === 'production' &&
      environment.DATABASE_PASSWORD === 'sa_hall'
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Production DATABASE_PASSWORD must not use development credentials.',
        path: ['DATABASE_PASSWORD'],
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  input: Record<string, unknown>,
): Environment {
  return environmentSchema.parse(input);
}
