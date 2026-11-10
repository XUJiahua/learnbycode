import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { topicSchema } from './lib/content-schema'

const topics = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/topics' }),
  schema: topicSchema,
})
export const collections = { topics }
