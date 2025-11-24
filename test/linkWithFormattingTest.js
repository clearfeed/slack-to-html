const assert = require('assert')
const { escapeForSlackWithMarkdown } = require('../src/index')

describe('Link with adjacent formatting', () => {
  describe('Link followed by italic', () => {
    it('should handle link followed by italic text', () => {
      const input = 'Trying <http://www.example.com|with> _links_ again and again'
      const expected = 'Trying <a href="http://www.example.com" target="_blank" rel="noopener noreferrer">with</a> <em class="slack_italics">links</em> again and again'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })

    it('should handle link followed by italic without space', () => {
      const input = '<http://example.com|click here> _important text_'
      const expected = '<a href="http://example.com" target="_blank" rel="noopener noreferrer">click here</a> <em class="slack_italics">important text</em>'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })
  })

  describe('Italic followed by link', () => {
    it('should handle italic followed by link', () => {
      const input = '_important text_ <http://example.com|click here>'
      const expected = '<em class="slack_italics">important text</em> <a href="http://example.com" target="_blank" rel="noopener noreferrer">click here</a>'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })
  })

  describe('Link with italic and plain text', () => {
    it('should handle link, italic, and plain text mixed', () => {
      const input = 'Check <http://example.com|this link> for _more info_ about it'
      const expected = 'Check <a href="http://example.com" target="_blank" rel="noopener noreferrer">this link</a> for <em class="slack_italics">more info</em> about it'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })
  })

  describe('Link without display text', () => {
    it('should handle link without display text followed by italic', () => {
      const input = '<http://example.com> _important_'
      const expected = '<a href="http://example.com" target="_blank" rel="noopener noreferrer">http://example.com</a> <em class="slack_italics">important</em>'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })
  })

  describe('Multiple links and formatting', () => {
    it('should handle multiple links with adjacent formatting', () => {
      const input = 'See <http://example.com|link1> _text_ and <http://example.org|link2> *bold*'
      const expected = 'See <a href="http://example.com" target="_blank" rel="noopener noreferrer">link1</a> <em class="slack_italics">text</em> and <a href="http://example.org" target="_blank" rel="noopener noreferrer">link2</a> <strong class="slack_bold">bold</strong>'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })
  })

  describe('Link with bold formatting', () => {
    it('should handle link followed by bold text', () => {
      const input = '<http://example.com|click> *bold text*'
      const expected = '<a href="http://example.com" target="_blank" rel="noopener noreferrer">click</a> <strong class="slack_bold">bold text</strong>'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })
  })

  describe('Link with strikethrough formatting', () => {
    it('should handle link followed by strikethrough text', () => {
      const input = '<http://example.com|click> ~strike~'
      const expected = '<a href="http://example.com" target="_blank" rel="noopener noreferrer">click</a> <s class="slack_strikethrough">strike</s>'
      const result = escapeForSlackWithMarkdown(input)
      assert.strictEqual(result, expected)
    })
  })
})

