import { describe, it, expect } from 'vitest'
import { containsSensitive, filterSensitive } from '../filter'

describe('containsSensitive', () => {
  it('should detect sensitive word', () => {
    expect(containsSensitive('你是傻逼')).toBe(true)
  })

  it('should pass normal text', () => {
    expect(containsSensitive('你玩得不错')).toBe(false)
  })
})

describe('filterSensitive', () => {
  it('should replace sensitive word', () => {
    const result = filterSensitive('你是傻逼吧')
    expect(result).not.toContain('傻逼')
    expect(result).toContain('***')
  })

  it('should return unchanged for clean text', () => {
    const result = filterSensitive('你玩得不错')
    expect(result).toBe('你玩得不错')
  })
})
