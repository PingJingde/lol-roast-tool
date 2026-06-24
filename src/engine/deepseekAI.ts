import type { PlayerData, RoastResult } from '@/types'
import { matchTemplate } from './templateRoast'

/**
 * Build the roast prompt for DeepSeek
 */
function buildPrompt(player: PlayerData): string {
  const champions = player.champions.map(c => `${c.name}(${c.winRate}% ${c.games}场)`).join('、')

  return `你是一个LOL锐评机器人，说话风格毒舌、幽默、一针见血。
请根据以下玩家数据，生成一段100字以内的锐评：

- 召唤师：${player.summonerName}
- 段位：${player.tier}
- 胜率：${player.winRate}%
- KDA：${player.kda.kills}/${player.kda.deaths}/${player.kda.assists}
- 常用英雄：${champions || '无数据'}
- 总场次：${player.totalGames}

要求：
1. 语气像朋友间互相损，不要太恶意
2. 针对具体数据吐槽，不要泛泛而谈
3. 加点LOL玩家才懂的梗
4. 禁止人身攻击和脏话
5. 只返回锐评文本，不要其他内容`
}

/**
 * Call DeepSeek web chat API
 * NOTE: Adjust based on actual DeepSeek web API endpoint
 */
async function callDeepSeekWeb(prompt: string): Promise<string> {
  const response = await fetch('https://chat.deepseek.com/api/v0/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API returned error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.content || ''
}

/**
 * AI roast engine: call DeepSeek + fallback to template matching
 */
export async function generateAIRoast(player: PlayerData): Promise<RoastResult> {
  try {
    const prompt = buildPrompt(player)
    const aiText = await callDeepSeekWeb(prompt)
    const text = aiText.trim()

    if (!text) throw new Error('AI returned empty content')

    return {
      text,
      grade: 'A',  // AI-generated default grade is A
      source: 'ai',
    }
  } catch {
    // AI failed — fall back to template matching
    const templateResult = matchTemplate(player)
    if (templateResult) return templateResult

    // Even templates failed — ultimate fallback
    return {
      text: '数据太少，我都不好意思锐评你——多打几把再来吧。',
      grade: 'C',
      source: 'template',
      templateId: 'no_champ_data',
    }
  }
}
