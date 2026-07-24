import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic()

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

export interface GenerateStructuredOptions {
  model?: string
  maxTokens?: number
}

/**
 * Send a structured-generation request to Claude. The system prompt sets the
 * role and ground rules; `userContext` is the task-specific payload (typically
 * the assembled context from context-builder).
 *
 * Returns the parsed + validated output of type `T`.
 *
 * On invalid JSON or schema validation failure, retries **once**. If the
 * second attempt also fails, throws — we never save malformed content.
 */
export async function generateStructured<T>(
  systemPrompt: string,
  userContext: string,
  schema: z.ZodType<T>,
  opts?: GenerateStructuredOptions,
): Promise<T> {
  const model = opts?.model ?? DEFAULT_MODEL
  const maxTokens = opts?.maxTokens ?? 4096

  let lastError: Error | undefined

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: systemPrompt,
        },
      ],
      messages: [{ role: 'user', content: userContext }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = new Error('No text block in Claude response')
      continue
    }

    const raw = extractJson(textBlock.text)

    try {
      const parsed = JSON.parse(raw)
      const result = schema.safeParse(parsed)
      if (!result.success) {
        lastError = new Error(
          `Schema validation failed: ${result.error.issues.map((i) => i.message).join('; ')}`,
        )
        continue
      }
      return result.data
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }
  }

  throw new Error(
    `generateStructured failed after 2 attempts. Last error: ${lastError?.message}`,
  )
}

/**
 * Strip markdown fences and leading/trailing junk that LLMs sometimes wrap
 * around JSON output, then return the cleaned string for JSON.parse().
 */
function extractJson(text: string): string {
  let trimmed = text.trim()

  // Remove ```json ... ``` fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    trimmed = fenceMatch[1].trim()
  }

  return trimmed
}
