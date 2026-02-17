import { escapeForSlackWithMarkdown } from '../src/index.js'

describe('markdown', () => {
  describe('code multiline', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('```this is a code multiline```').should.equal('<div class="slack_code"><code>this is a code multiline</code></div>')
    })

    it('should convert newlines', () => {
      escapeForSlackWithMarkdown('```this is a code multiline\nwith newlines```').should.equal('<div class="slack_code"><code>this is a code multiline<br>with newlines</code></div>')
    })

    it('should greedily capture backticks', () => {
      escapeForSlackWithMarkdown('````this is a code multiline with backticks````').should.equal('<div class="slack_code"><code>`this is a code multiline with backticks`</code></div>')
    })

    it('should not capture whitespace', () => {
      escapeForSlackWithMarkdown('```this is a code multiline``` ```and this is another```').should.equal('<div class="slack_code"><code>this is a code multiline</code></div> <div class="slack_code"><code>and this is another</code></div>')
    })

    it('should not apply markdown to text within a code block', () => {
      escapeForSlackWithMarkdown('```this is a code multiline with *asterisks*```').should.equal('<div class="slack_code"><code>this is a code multiline with *asterisks*</code></div>')
    })

    it('should not affect markdown after the code block', () => {
      escapeForSlackWithMarkdown('```this is a code multiline``` with some *bold* text after it').should.equal('<div class="slack_code"><code>this is a code multiline</code></div> with some <strong class="slack_bold">bold</strong> text after it')
    })
  })

  describe('code inline', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('`this is a code inline`').should.equal('<span class="slack_code"><code>this is a code inline</code></span>')
    })
  })

  describe('bold', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is *bold*').should.equal('this is <strong class="slack_bold">bold</strong>')
    })

    it('should capture as much as possible', () => {
      escapeForSlackWithMarkdown('this is *bold*with*more*asterisks*').should.equal('this is <strong class="slack_bold">bold*with*more*asterisks</strong>')
    })


    it('should render an element between quotes', () => {
      escapeForSlackWithMarkdown('this is "*bold*"').should.equal(
        'this is "<strong class="slack_bold">bold</strong>"'
      )
    })

    it('should render a normal text with underscores', () => {
      escapeForSlackWithMarkdown('this is a VARIABLE*NAME*TEST').should.equal(
        'this is a VARIABLE*NAME*TEST'
      )
    })

    it('should allow punctuation after closing delimiter', () => {
      escapeForSlackWithMarkdown('*bold*, next word').should.equal(
        '<strong class="slack_bold">bold</strong>, next word'
      )
      escapeForSlackWithMarkdown('Really? *yes*!').should.equal(
        'Really? <strong class="slack_bold">yes</strong>!'
      )
      escapeForSlackWithMarkdown('*label*: value').should.equal(
        '<strong class="slack_bold">label</strong>: value'
      )
      escapeForSlackWithMarkdown('*really*?').should.equal(
        '<strong class="slack_bold">really</strong>?'
      )
      escapeForSlackWithMarkdown("*today*'s").should.equal(
        "<strong class=\"slack_bold\">today</strong>'s"
      )
      escapeForSlackWithMarkdown('This is *bold*.').should.equal(
        'This is <strong class="slack_bold">bold</strong>.'
      )
    })
  })

  describe('italic', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is _italic_').should.equal('this is <em class="slack_italics">italic</em>')
    })

    it('should render an element between quotes', () => {
      escapeForSlackWithMarkdown('this is "_italic_"').should.equal(
        'this is "<em class="slack_italics">italic</em>"'
      )
    })

    it('should render a normal text with underscores', () => {
      escapeForSlackWithMarkdown('this is a VARIABLE_NAME_TEST').should.equal(
        'this is a VARIABLE_NAME_TEST'
      )
    })

    it('render normal and italic text inside longer quotes', () => {
      escapeForSlackWithMarkdown('"TEST_MESSAGE_TEST _italic_"').should.equal(
       '"TEST_MESSAGE_TEST <em class="slack_italics">italic</em>"'
      )
    })

    it('should render spaced out underscores as normal text', () => {
      escapeForSlackWithMarkdown('why _ would _ you _ do _ this? _ _italic_').should.equal(
        'why _ would _ you _ do _ this? _ <em class="slack_italics">italic</em>'
      )
    })

    it('should allow punctuation after closing delimiter', () => {
      escapeForSlackWithMarkdown('_italic_, next word').should.equal(
        '<em class="slack_italics">italic</em>, next word'
      )
      escapeForSlackWithMarkdown('Really? _yes_!').should.equal(
        'Really? <em class="slack_italics">yes</em>!'
      )
      escapeForSlackWithMarkdown('_label_: value').should.equal(
        '<em class="slack_italics">label</em>: value'
      )
      escapeForSlackWithMarkdown('_really_?').should.equal(
        '<em class="slack_italics">really</em>?'
      )
      escapeForSlackWithMarkdown("_today_'s").should.equal(
        "<em class=\"slack_italics\">today</em>'s"
      )
      escapeForSlackWithMarkdown('This is _italic_.').should.equal(
        'This is <em class="slack_italics">italic</em>.'
      )
    })
  })

  describe('strikethrough', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is ~struck~').should.equal('this is <s class="slack_strikethrough">struck</s>')
    })

    it('should render an element between quotes', () => {
      escapeForSlackWithMarkdown('this is "~struck~"').should.equal(
        'this is "<s class="slack_strikethrough">struck</s>"'
      )
    })

    it('should render a normal text with underscores', () => {
      escapeForSlackWithMarkdown('this is a VARIABLE~NAME~TEST').should.equal(
        'this is a VARIABLE~NAME~TEST'
      )
    })

    it('should allow punctuation after closing delimiter', () => {
      escapeForSlackWithMarkdown('~struck~, next word').should.equal(
        '<s class="slack_strikethrough">struck</s>, next word'
      )
      escapeForSlackWithMarkdown('Really? ~yes~!').should.equal(
        'Really? <s class="slack_strikethrough">yes</s>!'
      )
      escapeForSlackWithMarkdown('~label~: value').should.equal(
        '<s class="slack_strikethrough">label</s>: value'
      )
      escapeForSlackWithMarkdown('~really~?').should.equal(
        '<s class="slack_strikethrough">really</s>?'
      )
      escapeForSlackWithMarkdown("~today~'s").should.equal(
        "<s class=\"slack_strikethrough\">today</s>'s"
      )
      escapeForSlackWithMarkdown('This is ~struck~.').should.equal(
        'This is <s class="slack_strikethrough">struck</s>.'
      )
    })
  })

  describe('block quote', () => {
    it('should leave it alone if the block quote delimiter is preceded by non-whitespace content', () => {
      escapeForSlackWithMarkdown('this is not whitespace &gt;&gt;&gt;this is a block quote').should.equal('this is not whitespace &gt;&gt;&gt;this is a block quote')
    })

    it('should render an element', () => {
      escapeForSlackWithMarkdown('&gt;&gt;&gt;this is a block quote').should.equal('<div class="slack_block">this is a block quote</div>')
    })

    it('should replace newlines', () => {
      escapeForSlackWithMarkdown('&gt;&gt;&gt;this is a block quote\nwith newlines').should.equal('<div class="slack_block">this is a block quote<br>with newlines</div>')
    })
  })

  describe('inline quote', () => {
    it('should leave it alone if the quote delimiter is preceded by non-whitespace content', () => {
      escapeForSlackWithMarkdown('this is not whitespace &gt;inline quote').should.equal('this is not whitespace &gt;inline quote')
    })

    it('should render an element if the quote delimiter begins the line', () => {
      escapeForSlackWithMarkdown('&gt;inline quote').should.equal('<blockquote class="slack_block">inline quote</blockquote>')
    })

    it('should render an element if the quote delimiter is preceded only by whitespace', () => {
      escapeForSlackWithMarkdown('  \t   &gt;inline quote').should.equal('<blockquote class="slack_block">inline quote</blockquote>')
    })

    it('should render an element if the multiple single line quotes in string', () => {
      escapeForSlackWithMarkdown(
        '&gt;inline quote\n&gt;inline quote'
      ).should.equal(
        '<blockquote class="slack_block">inline quote</blockquote>\n<blockquote class="slack_block">inline quote</blockquote>'
      )
    })

    it('should render an element with multiple multiline quotes in string', () => {
      escapeForSlackWithMarkdown(
        '&gt; Multiline Quote 1 Line 1\n&gt; Multiline Quote 1 Line 2\nNo quote\n&gt; Multiline Quote 2 Line 1\n&gt; Multiline Quote 2 Line 2\nNo Quote\n&gt; Multiline Quote 3 Line 1\n&gt; Multiline Quote 3 Line 2\n'
      ).should.equal(
        '<blockquote class="slack_block"> Multiline Quote 1 Line 1</blockquote>\n<blockquote class="slack_block"> Multiline Quote 1 Line 2</blockquote>\nNo quote\n<blockquote class="slack_block"> Multiline Quote 2 Line 1</blockquote>\n<blockquote class="slack_block"> Multiline Quote 2 Line 2</blockquote>\nNo Quote\n<blockquote class="slack_block"> Multiline Quote 3 Line 1</blockquote>\n<blockquote class="slack_block"> Multiline Quote 3 Line 2</blockquote>\n'
      )
    })
  })

  describe('URL links', () => {
    it('should convert S3 URLs to clickable links', () => {
      escapeForSlackWithMarkdown(
        '<s3://bucket-name/path/to/file.txt> test'
      ).should.equal(
        '<a href="s3://bucket-name/path/to/file.txt" target="&#95;blank" rel="noopener noreferrer">s3://bucket-name/path/to/file.txt</a> test'
      )
    })

    it('should convert FTP URLs to clickable links', () => {
      escapeForSlackWithMarkdown(
        '<ftp://example.com/path/to/file.txt> test'
      ).should.equal(
        '<a href="ftp://example.com/path/to/file.txt" target="&#95;blank" rel="noopener noreferrer">ftp://example.com/path/to/file.txt</a> test'
      )
    })

    it('should convert HTTP URLs to clickable links', () => {
      escapeForSlackWithMarkdown(
        '<http://example.com/path/to/page.html> test'
      ).should.equal(
        '<a href="http://example.com/path/to/page.html" target="&#95;blank" rel="noopener noreferrer">http://example.com/path/to/page.html</a> test'
      )
    })
  })

  describe('links adjacent to markdown formatting', () => {
    it('should handle link immediately before italic text', () => {
      escapeForSlackWithMarkdown(
        'Check out <https://example.com> _this is italic_'
      ).should.equal(
        'Check out <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> <em class="slack_italics">this is italic</em>'
      )
    })

    it('should handle link immediately after italic text', () => {
      escapeForSlackWithMarkdown(
        '_this is italic_ <https://example.com> check it out'
      ).should.equal(
        '<em class="slack_italics">this is italic</em> <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> check it out'
      )
    })

    it('should handle link between italic text', () => {
      escapeForSlackWithMarkdown(
        '_first italic_ <https://example.com> _second italic_'
      ).should.equal(
        '<em class="slack_italics">first italic</em> <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> <em class="slack_italics">second italic</em>'
      )
    })

    it('should handle link immediately before bold text', () => {
      escapeForSlackWithMarkdown(
        'Check <https://example.com> *bold text*'
      ).should.equal(
        'Check <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> <strong class="slack_bold">bold text</strong>'
      )
    })

    it('should handle link immediately after bold text', () => {
      escapeForSlackWithMarkdown(
        '*bold text* <https://example.com> here'
      ).should.equal(
        '<strong class="slack_bold">bold text</strong> <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> here'
      )
    })

    it('should handle link immediately before strikethrough text', () => {
      escapeForSlackWithMarkdown(
        'Link: <https://example.com> ~struck text~'
      ).should.equal(
        'Link: <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> <s class="slack_strikethrough">struck text</s>'
      )
    })

    it('should handle link immediately after strikethrough text', () => {
      escapeForSlackWithMarkdown(
        '~struck text~ <https://example.com> done'
      ).should.equal(
        '<s class="slack_strikethrough">struck text</s> <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> done'
      )
    })

    it('should handle link immediately before inline code', () => {
      escapeForSlackWithMarkdown(
        'Visit <https://example.com> `code here`'
      ).should.equal(
        'Visit <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> <span class="slack_code"><code>code here</code></span>'
      )
    })

    it('should handle link immediately after inline code', () => {
      escapeForSlackWithMarkdown(
        '`code here` <https://example.com> visit'
      ).should.equal(
        '<span class="slack_code"><code>code here</code></span> <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> visit'
      )
    })

    it('should handle link with underscores not interfering with adjacent italic', () => {
      escapeForSlackWithMarkdown(
        '_italic_ <https://example.com/path_with_underscores> _more italic_'
      ).should.equal(
        '<em class="slack_italics">italic</em> <a href="https://example.com/path%5Fwith%5Funderscores" target="&#95;blank" rel="noopener noreferrer">https://example.com/path%5Fwith%5Funderscores</a> <em class="slack_italics">more italic</em>'
      )
    })

    it('should handle multiple markdown formats around a link', () => {
      escapeForSlackWithMarkdown(
        '*bold* _italic_ <https://example.com> ~strike~ `code`'
      ).should.equal(
        '<strong class="slack_bold">bold</strong> <em class="slack_italics">italic</em> <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> <s class="slack_strikethrough">strike</s> <span class="slack_code"><code>code</code></span>'
      )
    })

    it('should handle link with label adjacent to italic', () => {
      escapeForSlackWithMarkdown(
        '_start italic_ <https://example.com|Click Here> _end italic_'
      ).should.equal(
        '<em class="slack_italics">start italic</em> <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">Click Here</a> <em class="slack_italics">end italic</em>'
      )
    })

    it('should handle link with markdown chars in URL adjacent to actual markdown', () => {
      escapeForSlackWithMarkdown(
        '*bold* <https://example.com?param=*value*&test=_underscore_> *more bold*'
      ).should.equal(
        '<strong class="slack_bold">bold</strong> <a href="https://example.com?param=%2Avalue%2A&test=%5Funderscore%5F" target="&#95;blank" rel="noopener noreferrer">https://example.com?param=%2Avalue%2A&test=%5Funderscore%5F</a> <strong class="slack_bold">more bold</strong>'
      )
    })

    it('should handle no space between link and italic delimiter', () => {
      escapeForSlackWithMarkdown(
        'Text <https://example.com>_not italic_ more'
      ).should.equal(
        'Text <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a>_not italic_ more'
      )
    })

    it('should handle link in middle of sentence with surrounding markdown', () => {
      escapeForSlackWithMarkdown(
        'This is *important* visit <https://example.com> for _more details_ about it'
      ).should.equal(
        'This is <strong class="slack_bold">important</strong> visit <a href="https://example.com" target="&#95;blank" rel="noopener noreferrer">https://example.com</a> for <em class="slack_italics">more details</em> about it'
      )
    })
  })

  it('should convert the url to a clickable link with correct url and text', () => {
    escapeForSlackWithMarkdown(
     '<ftp://user:password@server/pathname|click here>'
    ).should.equal(
      '<a href="ftp://user:password@server/pathname" target="&#95;blank" rel="noopener noreferrer">click here</a>'
    )
  })

  it('should convert the url to a clickable link with correct url and text edge case ', () => {
    escapeForSlackWithMarkdown(
     '<http://s3://somes3yrl.env|ftp://user:password@server/pathname>'
    ).should.equal(
      '<a href="http://s3://somes3yrl.env" target="&#95;blank" rel="noopener noreferrer">ftp://user:password@server/pathname</a>'
    )
  })

  it('should convert the paragraph breaks to slack line breaks', () => {
    escapeForSlackWithMarkdown('paragraph 1\n\nparagraph 2').should.equal(
      'paragraph 1<div class="slack_line_break"></div>paragraph 2'
    )
  })

  it('should correctly handle paragraph breaks between blockquotes', () => {
    escapeForSlackWithMarkdown('&gt; line 1\n\n&gt; line 2').should.equal(
      '<blockquote class="slack_block"> line 1</blockquote><div class="slack_line_break"></div><blockquote class="slack_block"> line 2</blockquote>'
    )
  })

  describe('skipParagraphBreaks option', () => {
    it('should skip paragraph break conversion when skipParagraphBreaks is true', () => {
      escapeForSlackWithMarkdown('paragraph 1\n\nparagraph 2', { skipParagraphBreaks: true }).should.equal(
        'paragraph 1\n\nparagraph 2'
      )
    })

    it('should process paragraph breaks normally when skipParagraphBreaks is false', () => {
      escapeForSlackWithMarkdown('paragraph 1\n\nparagraph 2', { skipParagraphBreaks: false }).should.equal(
        'paragraph 1<div class="slack_line_break"></div>paragraph 2'
      )
    })

    it('should skip paragraph breaks in text with markdown formatting when skipParagraphBreaks is true', () => {
      escapeForSlackWithMarkdown('*bold text*\n\n_italic text_', { skipParagraphBreaks: true }).should.equal(
        '<strong class="slack_bold">bold text</strong>\n\n<em class="slack_italics">italic text</em>'
      )
    })

    it('should skip paragraph breaks between blockquotes when skipParagraphBreaks is true', () => {
      escapeForSlackWithMarkdown('&gt; line 1\n\n&gt; line 2', { skipParagraphBreaks: true }).should.equal(
        '<blockquote class="slack_block"> line 1</blockquote>\n\n<blockquote class="slack_block"> line 2</blockquote>'
      )
    })

    it('should handle multiple paragraph breaks with skipParagraphBreaks true', () => {
      escapeForSlackWithMarkdown('para 1\n\npara 2\n\npara 3', { skipParagraphBreaks: true }).should.equal(
        'para 1\n\npara 2\n\npara 3'
      )
    })

    it('should handle multiple paragraph breaks with skipParagraphBreaks false', () => {
      escapeForSlackWithMarkdown('para 1\n\npara 2\n\npara 3', { skipParagraphBreaks: false }).should.equal(
        'para 1<div class="slack_line_break"></div>para 2<div class="slack_line_break"></div>para 3'
      )
    })
  })
})

