import { describe, it, expect } from 'vitest'

describe('Basic Test Suite', () => {
  it('should pass basic math test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should pass string test', () => {
    expect('hello').toBe('hello')
  })

  it('should pass array test', () => {
    expect([1, 2, 3]).toHaveLength(3)
  })
})
