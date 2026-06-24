// Sensitive word list — expand for production
const SENSITIVE_WORDS = [
  '习近平', '习大大', '包子', '维尼',
  'cnm', 'nmsl', 'sb', '傻逼', '操你', '他妈',
  '支那', 'ching', 'nig',
]

/**
 * Check if text contains any sensitive word
 */
export function containsSensitive(text: string): boolean {
  const lower = text.toLowerCase()
  return SENSITIVE_WORDS.some(word => lower.includes(word.toLowerCase()))
}

/**
 * Filter sensitive words by replacing with ***
 */
export function filterSensitive(text: string): string {
  let filtered = text
  for (const word of SENSITIVE_WORDS) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    filtered = filtered.replace(regex, '***')
  }
  return filtered
}

/**
 * Safe fallback roast text when content is too sensitive
 */
export const SAFE_FALLBACK = '这位召唤师的数据看起来很有故事，但我们还是留点面子吧。多练练，下次一定！'
