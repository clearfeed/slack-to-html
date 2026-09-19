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

  /**
   * Making the author's text literal must not change how this renderer already handled
   * Slack's own entities inside code. Escaping those too would have shown the reader raw
   * `<@U123>` / `<https://x|y>` markup where a mention or link rendered before - the same
   * defect as an author-typed tag reaching the DOM, introduced from the other side.
   */
  describe('preserves existing entity handling inside code content', () => {
    it('should resolve a user mention', () => {
      escapeForSlackWithMarkdown('```cc <@U123>```', options).should.equal(
        '<div class="slack_code"><code>cc <span class="user-mention">@ashish</span></code></div>'
      )
    })

    it('should resolve a usergroup mention', () => {
      escapeForSlackWithMarkdown('```cc <!subteam^S123>```', options).should.equal(
        '<div class="slack_code"><code>cc @devs</code></div>'
      )
    })

    it('should resolve a channel mention', () => {
      escapeForSlackWithMarkdown('```see <#C123>```', options).should.equal(
        '<div class="slack_code"><code>see #general</code></div>'
      )
    })

    it('should linkify a bare url', () => {
      escapeForSlackWithMarkdown('```see <https://x.com>```').should.equal(
        '<div class="slack_code"><code>see ' +
        '<a href="https://x.com" target="&#95;blank" rel="noopener noreferrer">https://x.com</a>' +
        '</code></div>'
      )
    })

    it('should linkify a labelled url', () => {
      escapeForSlackWithMarkdown('```see <https://x.com|docs>```').should.equal(
        '<div class="slack_code"><code>see ' +
        '<a href="https://x.com" target="&#95;blank" rel="noopener noreferrer">docs</a>' +
        '</code></div>'
      )
    })

    it('should linkify a url inside inline code', () => {
      escapeForSlackWithMarkdown('use `<https://x.com>` here').should.equal(
        'use <span class="slack_code"><code>' +
        '<a href="https://x.com" target="&#95;blank" rel="noopener noreferrer">https://x.com</a>' +
        '</code></span> here'
      )
    })

    /**
     * The code delimiters match across newlines, so the shield applied during link
     * replacement has to as well - otherwise the link becomes an anchor before the code
     * content is encoded, and the anchor is escaped into literal markup.
     */
    it('should linkify a url inside inline code spanning newlines', () => {
      escapeForSlackWithMarkdown('`a\n<https://x.com>\nb`').should.equal(
        '<span class="slack_code"><code>a\n' +
        '<a href="https://x.com" target="&#95;blank" rel="noopener noreferrer">https://x.com</a>' +
        '\nb</code></span>'
      )
    })

    /**
     * An author-typed anchor is not a Slack entity, so it stays literal even though the
     * resolved ones above are emitted as real markup.
     */
    it('should keep an author-typed anchor literal', () => {
      escapeForSlackWithMarkdown('```<a href="http://x.com">y</a>```').should.equal(
        '<div class="slack_code"><code>&lt;a href="http://x.com"&gt;y&lt;/a&gt;</code></div>'
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
