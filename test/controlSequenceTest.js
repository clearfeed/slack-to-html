import { escapeForSlack } from '../src/index.js'

describe('control sequences', () => {
  describe('user mentions', () => {
    it('should render the label', () => {
      escapeForSlack('<@U123|someone>').should.equal('<span class="user-mention">@someone</span>')
      escapeForSlack('<@W123|someone>').should.equal('<span class="user-mention">@someone</span>')
    })

    it('should render the user name if present', () => {
      escapeForSlack('<@U123>', { users: { U123: 'someone' } }).should.equal('<span class="user-mention">@someone</span>')
      escapeForSlack('<@W123>', { users: { W123: 'someone' } }).should.equal('<span class="user-mention">@someone</span>')
    })

    it('should render the original value if user name is not present', () => {
      escapeForSlack('<@U123>').should.equal('&lt;@U123&gt;')
    })

    it('should render the fallback text', () => {
      escapeForSlack('<@U123|someone>').should.equal('<span class="user-mention">@someone</span>')
    })

    it('should render the username literal', () => {
      escapeForSlack('<@someone>').should.equal('<span class="user-mention">@someone</span>')
    })
  })

  describe('channel mentions', () => {
    it('should render the label', () => {
      escapeForSlack('<#C123|channel>').should.equal('#channel')
    })

    it('should render the channel name if present', () => {
      escapeForSlack('<#C123>', { channels: { C123: 'channel' } }).should.equal('#channel')
    })

    it('should render the original value if the channel name is not present', () => {
      escapeForSlack('<#C123>').should.equal('&lt;#C123&gt;')
    })

    it('should render the channel literal', () => {
      escapeForSlack('<#channel>').should.equal('#channel')
    })
  })

  describe('hyperlinks', () => {
    it('should render an anchor tag', () => {
      escapeForSlack('<https://swiftype.com>').should.equal('<a href="https://swiftype.com" target="_blank" rel="noopener noreferrer">https://swiftype.com</a>')
    })

    it('should render the label in the anchor tag if present', () => {
      escapeForSlack('<https://swiftype.com|Swiftype>').should.equal('<a href="https://swiftype.com" target="_blank" rel="noopener noreferrer">Swiftype</a>')
    })

    it('should encode characters used by slack mrkdwn in links and not replace them with divs', () => {
      escapeForSlack('<https://swiftype.com?q=~``*bold*&```some code```~code_block~_italics_>').should.equal('<a href="https://swiftype.com?q=%7E%27%27%2Abold%2A%26%27%27%27some code%27%27%27%7Ecode%5Fblock%7E%5Fitalics%5F" target="_blank" rel="noopener noreferrer">https://swiftype.com?q=%7E%27%27%2Abold%2A%26%27%27%27some code%27%27%27%7Ecode%5Fblock%7E%5Fitalics%5F</a>')
    })
  })

  describe('mail links', () => {
    it('should render a mailto tag', () => {
      escapeForSlack('<mailto:test@swiftype.com>').should.equal('<a href="mailto:test@swiftype.com" target="_blank" rel="noopener noreferrer">test@swiftype.com</a>')
    })

    it('should render the label in the anchor tag if present', () => {
      escapeForSlack('<mailto:test@swiftype.com|Test>').should.equal('<a href="mailto:test@swiftype.com" target="_blank" rel="noopener noreferrer">Test</a>')
    })
  })

  describe('phone links', () => {
    it('should render a tel anchor tag', () => {
      escapeForSlack('<tel:123-456-7890>').should.equal('<a href="tel:123-456-7890">123-456-7890</a>')
    })

    it('should render the label in the tel anchor tag if present', () => {
      escapeForSlack('<tel:123-456-7890|Call me!>').should.equal('<a href="tel:123-456-7890">Call me!</a>')
    })
  })

  describe('commands', () => {
    describe('known commands', () => {
      ['here', 'channel', 'group', 'everyone'].map((command) => {
        it(`when <!${command}> should render as @${command}`, () => {
          escapeForSlack(`<!${command}>`).should.equal(`@${command}`)
        })

        it(`when <!${command}> should not render as the label`, () => {
          escapeForSlack(`<!${command}|something_else>`).should.not.equal('@something_else')
        })
      })

      describe('for the subteam command', () => {
        it('should render as a group link when the label is present', () => {
          escapeForSlack('<!subteam^S123|swiftype-eng>').should.equal('swiftype-eng')
        })

        it('should render the group name if present', () => {
          escapeForSlack('<!subteam^S123>', { usergroups: { S123: 'swiftype-eng' } }).should.equal('swiftype-eng')
        })

        it('should render the original value if the channel name is not present', () => {
          escapeForSlack('<!subteam^S123>').should.equal('&lt;!subteam^S123&gt;')
        })
      })
    })

    describe('unknown commands', () => {
      it('should render the label if present', () => {
        escapeForSlack('<!foo|bar>').should.equal('<bar>')
      })

      it('should render as the literal if present', () => {
        escapeForSlack('<!foo>').should.equal('<foo>')
      })
    })
  })

  describe('ordering', () => {
    it('should render <!here|@here> <https://swiftype.com>', () => {
      escapeForSlack('<!here|@here> <https://swiftype.com>').should.equal('@here <a href="https://swiftype.com" target="_blank" rel="noopener noreferrer">https://swiftype.com</a>')
    })
  })
})
