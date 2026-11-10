import { z } from 'zod'
const localized = z.object({ zh: z.string().min(1), en: z.string().min(1) }).strict()
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const topicSchema = z.object({
  title: localized, subtitle: localized, description: localized,
  order: z.number().int(), tags: z.object({ zh: z.array(z.string()), en: z.array(z.string()) }).strict(),
  lessons: z.array(z.object({
    slug: slugSchema, title: localized, description: localized,
    status: z.enum(['published', 'planned']), minutes: z.number().positive().int(),
    verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).superRefine((lesson, ctx) => {
    if (lesson.status === 'published' && !lesson.verifiedAt)
      ctx.addIssue({ code: 'custom', message: 'Published lesson requires verifiedAt', path: ['verifiedAt'] })
  })),
}).superRefine((topic, ctx) => {
  if (new Set(topic.lessons.map(x => x.slug)).size !== topic.lessons.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate lesson slug', path: ['lessons'] })
})
