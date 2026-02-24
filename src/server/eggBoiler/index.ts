import z from 'zod';
import { AuthError } from 'modelence';
import { Module, ObjectId, UserInfo, Store, schema } from 'modelence/server';

// Egg boiling types with their cooking times in seconds
export const EGG_TYPES = {
  'jelly-yolk': { name: 'Jelly Yolk (Soft)', time: 360, description: 'Runny yolk, set white' },
  'semi-hard': { name: 'Semi-Hard (Medium)', time: 480, description: 'Jammy yolk, firm white' },
  'hard': { name: 'Hard Boiled', time: 600, description: 'Fully set yolk and white' },
} as const;

// Nutritional info per large egg (50g)
export const EGG_NUTRITION = {
  calories: 72,
  protein: 6.3,
  fat: 4.8,
  carbs: 0.4,
  cholesterol: 186,
  vitaminA: 270,
  vitaminD: 41,
  vitaminB12: 0.6,
  selenium: 15.4,
  choline: 147,
};

// Database store for egg cooking sessions
const dbEggSessions = new Store('eggSessions', {
  schema: {
    userId: schema.userId(),
    eggType: schema.string(),
    eggCount: schema.number(),
    startedAt: schema.date(),
    completedAt: schema.date().optional(),
    createdAt: schema.date(),
  },
  indexes: [{ key: { userId: 1 } }, { key: { createdAt: -1 } }],
});

export default new Module('eggBoiler', {
  stores: [dbEggSessions],

  queries: {
    getEggTypes: async () => {
      return EGG_TYPES;
    },

    getNutrition: async (args: unknown) => {
      const { eggCount } = z.object({ eggCount: z.number().min(1).max(12) }).parse(args);
      return {
        calories: EGG_NUTRITION.calories * eggCount,
        protein: Math.round(EGG_NUTRITION.protein * eggCount * 10) / 10,
        fat: Math.round(EGG_NUTRITION.fat * eggCount * 10) / 10,
        carbs: Math.round(EGG_NUTRITION.carbs * eggCount * 10) / 10,
        cholesterol: EGG_NUTRITION.cholesterol * eggCount,
        vitaminA: EGG_NUTRITION.vitaminA * eggCount,
        vitaminD: EGG_NUTRITION.vitaminD * eggCount,
        vitaminB12: Math.round(EGG_NUTRITION.vitaminB12 * eggCount * 10) / 10,
        selenium: Math.round(EGG_NUTRITION.selenium * eggCount * 10) / 10,
        choline: EGG_NUTRITION.choline * eggCount,
      };
    },

    getRecentSessions: async (_args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const sessions = await dbEggSessions.fetch(
        { userId: new ObjectId(user.id) },
        { sort: { createdAt: -1 }, limit: 10 }
      );

      return sessions.map((session) => ({
        _id: session._id.toString(),
        eggType: session.eggType,
        eggCount: session.eggCount,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
      }));
    },
  },

  mutations: {
    startSession: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const { eggType, eggCount } = z
        .object({
          eggType: z.enum(['jelly-yolk', 'semi-hard', 'hard']),
          eggCount: z.number().min(1).max(12),
        })
        .parse(args);

      const result = await dbEggSessions.insertOne({
        userId: new ObjectId(user.id),
        eggType,
        eggCount,
        startedAt: new Date(),
        createdAt: new Date(),
      });

      return { sessionId: result.insertedId.toString() };
    },

    completeSession: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const { sessionId } = z.object({ sessionId: z.string() }).parse(args);

      const session = await dbEggSessions.requireOne({ _id: new ObjectId(sessionId) });
      if (session.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      await dbEggSessions.updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { completedAt: new Date() } }
      );
    },
  },
});
