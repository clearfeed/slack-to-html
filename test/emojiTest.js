import { escapeForSlack } from '../src/index.js'

const customEmoji = {}
const users = {}

describe('emoji', () => {
  describe('static emoji', () => {
    it('should render replace an emoji', () => {
      escapeForSlack(':wave:').should.equal('<span title=":wave:">&#x1F44B;</span>')
    })

    it ('should render multiple emoji in a row', () => {
      escapeForSlack(':wave: :wave:').should.equal('<span title=":wave:">&#x1F44B;</span> <span title=":wave:">&#x1F44B;</span>');
      escapeForSlack(':wave::wave:').should.equal('<span title=":wave:">&#x1F44B;</span><span title=":wave:">&#x1F44B;</span>');
    })
  })

  describe('custom emoji', () => {
    it('should render an img tag', () => {
      escapeForSlack(':swiftype:', { customEmoji: { swiftype: 'https://swiftype.com/favicon.ico' } }).should.equal('<img alt="swiftype" src="https://swiftype.com/favicon.ico" title=":swiftype:" class="slack_emoji" />')
    })

    it('should should be able to alias to a static emoji', () => {
      escapeForSlack(':goodbye:', { customEmoji: { goodbye: 'alias:wave' } }).should.equal('<span title=":goodbye:">&#x1F44B;</span>')
    })

    it('should render multiple emoji in a row', () => {
      const customEmoji = { swiftype: 'https://swiftype.com/favicon.ico', goodbye: 'alias:wave' };
      escapeForSlack(':swiftype: :goodbye:', { customEmoji }).should.equal('<img alt="swiftype" src="https://swiftype.com/favicon.ico" title=":swiftype:" class="slack_emoji" /> <span title=":goodbye:">&#x1F44B;</span>')
      escapeForSlack(':swiftype::goodbye:', { customEmoji }).should.equal('<img alt="swiftype" src="https://swiftype.com/favicon.ico" title=":swiftype:" class="slack_emoji" /><span title=":goodbye:">&#x1F44B;</span>')
    })
  })

  describe('skipEmojiSpans option', () => {
    it('should skip span wrapper when skipEmojiSpans is true', () => {
      escapeForSlack(':wave:', { skipEmojiSpans: true }).should.equal('&#x1F44B;')
    })

    it('should skip span wrapper for multiple emojis', () => {
      escapeForSlack(':wave: :wave:', { skipEmojiSpans: true }).should.equal('&#x1F44B; &#x1F44B;')
      escapeForSlack(':wave::wave:', { skipEmojiSpans: true }).should.equal('&#x1F44B;&#x1F44B;')
    })

    it('should include span wrapper by default (backward compatibility)', () => {
      escapeForSlack(':wave:').should.equal('<span title=":wave:">&#x1F44B;</span>')
      escapeForSlack(':wave:', { skipEmojiSpans: false }).should.equal('<span title=":wave:">&#x1F44B;</span>')
    })

    it('should skip span wrapper for aliased emoji when skipEmojiSpans is true', () => {
      escapeForSlack(':goodbye:', { customEmoji: { goodbye: 'alias:wave' }, skipEmojiSpans: true }).should.equal('&#x1F44B;')
    })

    it('should still render img tags for custom emoji URLs regardless of skipEmojiSpans', () => {
      // Custom emoji with URLs should always render as img tags
      escapeForSlack(':swiftype:', { customEmoji: { swiftype: 'https://swiftype.com/favicon.ico' }, skipEmojiSpans: true })
        .should.equal('<img alt="swiftype" src="https://swiftype.com/favicon.ico" title=":swiftype:" class="slack_emoji" />')
    })
  })
})
