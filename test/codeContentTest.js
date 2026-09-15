import { escapeForSlackWithMarkdown } from '../src/index.js'

const options = {
  users: { U123: 'ashish' },
  usergroups: { S123: 'devs' },
  channels: { C123: 'general' }
}

describe('code content', () => {
  describe('literal encoding', () => {
    it('should encode a raw tag inside a code block', () => {
      escapeForSlackWithMarkdown('```<hello> hii </hello>```').should.equal(
        '<div class="slack_code"><code>&lt;hello&gt; hii &lt;/hello&gt;</code></div>'
      )
    })

    it('should encode a raw tag inside inline code', () => {
      escapeForSlackWithMarkdown('use `<div>` here').should.equal(
        'use <span class="slack_code"><code>&lt;div&gt;</code></span> here'
      )
    })

    it('should encode an ampersand inside a code block', () => {
      escapeForSlackWithMarkdown('```A & B```').should.equal(
        '<div class="slack_code"><code>A &amp; B</code></div>'
      )
    })

    it('should leave Slack-escaped content unchanged', () => {
      escapeForSlackWithMarkdown('```&lt;hello&gt; hii &lt;/hello&gt;```').should.equal(
        '<div class="slack_code"><code>&lt;hello&gt; hii &lt;/hello&gt;</code></div>'
      )
    })

    it('should produce the same output for raw and Slack-escaped content', () => {
      escapeForSlackWithMarkdown('```<a>&</a>```').should.equal(
        escapeForSlackWithMarkdown('```&lt;a&gt;&amp;&lt;/a&gt;```')
      )
    })

    /**
     * The cost of decoding once: raw text that was meant to read `&lt;` is
     * indistinguishable from Slack's encoding of `<`, so it renders decoded.
     */
    it('should render a literal Slack entity as the character it encodes', () => {
      escapeForSlackWithMarkdown('```I typed &lt;p&gt;```').should.equal(
        '<div class="slack_code"><code>I typed &lt;p&gt;</code></div>'
      )
    })

    it('should keep newlines and indentation inside a code block', () => {
      escapeForSlackWithMarkdown('```<a>\n  <b>x</b>\n</a>```').should.equal(
        '<div class="slack_code"><code>&lt;a&gt;<br>  &lt;b&gt;x&lt;/b&gt;<br>&lt;/a&gt;</code></div>'
      )
    })

    it('should not treat an encoded angle bracket as a blockquote', () => {
      escapeForSlackWithMarkdown('```> quoted```').should.equal(
        '<div class="slack_code"><code>&gt; quoted</code></div>'
      )
    })
  })

  describe('no Slack parsing inside code content', () => {
    it('should not resolve a user mention', () => {
      escapeForSlackWithMarkdown('```cc <@U123>```', options).should.equal(
        '<div class="slack_code"><code>cc &lt;@U123&gt;</code></div>'
      )
    })

    it('should not resolve a usergroup mention', () => {
      escapeForSlackWithMarkdown('```cc <!subteam^S123>```', options).should.equal(
        '<div class="slack_code"><code>cc &lt;!subteam^S123&gt;</code></div>'
      )
    })

    it('should not resolve a channel mention', () => {
      escapeForSlackWithMarkdown('```see <#C123>```', options).should.equal(
        '<div class="slack_code"><code>see &lt;#C123&gt;</code></div>'
      )
    })

    it('should not linkify a bare url', () => {
      escapeForSlackWithMarkdown('```see <https://x.com>```').should.equal(
        '<div class="slack_code"><code>see &lt;https://x.com&gt;</code></div>'
      )
    })

    it('should not linkify a labelled url', () => {
      escapeForSlackWithMarkdown('```see <https://x.com|docs>```').should.equal(
        '<div class="slack_code"><code>see &lt;https://x.com|docs&gt;</code></div>'
      )
    })

    it('should not linkify a url inside inline code', () => {
      escapeForSlackWithMarkdown('use `<https://x.com>` here').should.equal(
        'use <span class="slack_code"><code>&lt;https://x.com&gt;</code></span> here'
      )
    })

    /**
     * The code delimiters match across newlines, so the shield applied during
     * link replacement has to as well — otherwise the link is turned into an
     * anchor first and then shown as literal markup inside the code span.
     */
    it('should not linkify a url inside inline code spanning newlines', () => {
      escapeForSlackWithMarkdown('`a\n<https://x.com>\nb`').should.equal(
        '<span class="slack_code"><code>a\n&lt;https://x.com&gt;\nb</code></span>'
      )
    })

    it('should not apply bold inside code content', () => {
      escapeForSlackWithMarkdown('```*not bold*```').should.equal(
        '<div class="slack_code"><code>*not bold*</code></div>'
      )
    })

    it('should never emit markup from code content', () => {
      escapeForSlackWithMarkdown('```<img src=x onerror=y>```').should.equal(
        '<div class="slack_code"><code>&lt;img src=x onerror=y&gt;</code></div>'
      )
    })
  })

  describe('outside code content', () => {
    it('should still resolve mentions and links', () => {
      escapeForSlackWithMarkdown('cc <@U123> see <https://x.com|docs>', options).should.equal(
        'cc <span class="user-mention">@ashish</span> see ' +
        '<a href="https://x.com" target="&#95;blank" rel="noopener noreferrer">docs</a>'
      )
    })

    it('should resolve a link next to a code span', () => {
      escapeForSlackWithMarkdown('`code` <https://x.com> `more`').should.equal(
        '<span class="slack_code"><code>code</code></span> ' +
        '<a href="https://x.com" target="&#95;blank" rel="noopener noreferrer">https://x.com</a> ' +
        '<span class="slack_code"><code>more</code></span>'
      )
    })

    it('should escape a raw tag outside code content', () => {
      escapeForSlackWithMarkdown('<hello> hii </hello>').should.equal(
        '&lt;hello&gt; hii &lt;/hello&gt;'
      )
    })

    it('should leave an unresolved mention escaped, not as markup', () => {
      escapeForSlackWithMarkdown('<!foo> and <@Uxxx>').should.equal(
        '&lt;foo&gt; and &lt;@Uxxx&gt;'
      )
    })

    it('should treat a line-initial angle bracket as a blockquote, as Slack does', () => {
      escapeForSlackWithMarkdown('> quoted').should.equal(
        // Identical to the Slack path's output for '&gt; quoted'.
        '<blockquote class="slack_block"> quoted</blockquote>'
      )
    })
  })
})
