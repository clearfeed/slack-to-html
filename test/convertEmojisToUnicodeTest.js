import { convertEmojisToUnicode } from '../src/index.js'

describe('convertEmojisToUnicode', () => {
  describe('basic emoji conversion', () => {
    it('should convert simple emoji to unicode', () => {
      convertEmojisToUnicode('Hello :wave:').should.equal('Hello 👋')
    })

    it('should convert multiple emoji in text', () => {
      convertEmojisToUnicode('Hello :wave: :smile:').should.equal('Hello 👋 😄')
    })

    it('should leave text without emoji unchanged', () => {
      convertEmojisToUnicode('Hello world').should.equal('Hello world')
    })

    it('should leave unknown emoji unchanged', () => {
      convertEmojisToUnicode('Hello :nonexistent:').should.equal('Hello :nonexistent:')
    })
  })

  describe('emoji with hyphens', () => {
    it('should convert flag emoji with hyphens', () => {
      convertEmojisToUnicode(':flag-ac:').should.equal('🇦🇨')
    })

    it('should convert multiple flag emoji', () => {
      convertEmojisToUnicode(':flag-ad: :flag-ae:').should.equal('🇦🇩 🇦🇪')
    })

    it('should convert gendered emoji with hyphens', () => {
      convertEmojisToUnicode(':male-farmer:').should.equal('👨‍🌾')
    })

    it('should convert skin tone emoji with hyphens', () => {
      convertEmojisToUnicode(':wave::skin-tone-2:').should.equal('👋🏻')
    })
  })

  describe('complex emoji sequences', () => {
    it('should convert emoji with ZWJ sequences', () => {
      // man-technologist uses ZWJ (zero-width joiner)
      convertEmojisToUnicode(':male-technologist:').should.equal('👨‍💻')
    })

    it('should convert numeric emoji names', () => {
      convertEmojisToUnicode(':8ball:').should.equal('🎱')
    })

    it('should handle +1 and -1 emoji', () => {
      convertEmojisToUnicode(':+1:').should.equal('👍')
      convertEmojisToUnicode(':-1:').should.equal('👎')
    })
  })

  describe('custom emoji', () => {
    it('should use custom emoji when provided', () => {
      const customEmoji = {
        'custom': '1F44B' // wave emoji
      }
      convertEmojisToUnicode(':custom:', customEmoji).should.equal('👋')
    })

    it('should skip custom emoji with URLs', () => {
      const customEmoji = {
        'custom': 'https://example.com/emoji.png'
      }
      convertEmojisToUnicode(':custom:', customEmoji).should.equal(':custom:')
    })

    it('should prioritize custom emoji over built-in', () => {
      const customEmoji = {
        'wave': '1F600' // grinning face instead of wave
      }
      convertEmojisToUnicode(':wave:', customEmoji).should.equal('😀')
    })
  })

  describe('alias resolution', () => {
    it('should resolve single-level aliases', () => {
      const customEmoji = {
        'mywave': 'alias:wave'
      }
      convertEmojisToUnicode(':mywave:', customEmoji).should.equal('👋')
    })

    it('should resolve multi-level alias chains', () => {
      const customEmoji = {
        'alias1': 'alias:alias2',
        'alias2': 'alias:wave'
      }
      convertEmojisToUnicode(':alias1:', customEmoji).should.equal('👋')
    })

    it('should handle broken alias chains gracefully', () => {
      const customEmoji = {
        'broken': 'alias:nonexistent'
      }
      convertEmojisToUnicode(':broken:', customEmoji).should.equal(':broken:')
    })
  })

  describe('preservation of other content', () => {
    it('should not modify Slack links', () => {
      const text = '<https://example.com|link text> :smile:'
      convertEmojisToUnicode(text).should.equal('<https://example.com|link text> 😄')
    })

    it('should not modify user mentions', () => {
      const text = '<@U123> :wave:'
      convertEmojisToUnicode(text).should.equal('<@U123> 👋')
    })

    it('should not modify channel mentions', () => {
      const text = '<#C123|general> :smile:'
      convertEmojisToUnicode(text).should.equal('<#C123|general> 😄')
    })

    it('should not modify markdown', () => {
      const text = '*bold* _italic_ ~strike~ :wave:'
      convertEmojisToUnicode(text).should.equal('*bold* _italic_ ~strike~ 👋')
    })

    it('should preserve colons that are not emoji', () => {
      const text = 'Time is 12:30:45'
      convertEmojisToUnicode(text).should.equal('Time is 12:30:45')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      convertEmojisToUnicode('').should.equal('')
    })

    it('should handle string with only emoji', () => {
      convertEmojisToUnicode(':smile:').should.equal('😄')
    })

    it('should handle consecutive emoji without spaces', () => {
      convertEmojisToUnicode(':smile::wave::heart:').should.equal('😄👋❤️')
    })

    it('should handle emoji at start, middle, and end', () => {
      convertEmojisToUnicode(':wave: middle :smile: end :heart:').should.equal('👋 middle 😄 end ❤️')
    })
  })
})
