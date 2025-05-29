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


    it("should render an element between quotes", () => {
      escapeForSlackWithMarkdown('this is "*bold*"').should.equal(
        'this is "<strong class="slack_bold">bold</strong>"'
      )
    })

    it("should render a normal text with underscores", () => {
      escapeForSlackWithMarkdown('this is a VARIABLE*NAME*TEST').should.equal(
        'this is a VARIABLE*NAME*TEST'
      )
    })
  })

  describe('italic', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is _italic_').should.equal('this is <em class="slack_italics">italic</em>')
    })

    it("should render an element between quotes", () => {
      escapeForSlackWithMarkdown('this is "_italic_"').should.equal(
        'this is "<em class="slack_italics">italic</em>"'
      )
    })

    it("should render a normal text with underscores", () => {
      escapeForSlackWithMarkdown('this is a VARIABLE_NAME_TEST').should.equal(
        'this is a VARIABLE_NAME_TEST'
      )
    })

    it("render normal and italic text inside longer quotes", () => {
      escapeForSlackWithMarkdown('"TEST_MESSAGE_TEST _italic_"').should.equal(
       '"TEST_MESSAGE_TEST <em class="slack_italics">italic</em>"'
      )
    })
  })

  describe('strikethrough', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is ~struck~').should.equal('this is <s class="slack_strikethrough">struck</s>')
    })

    it("should render an element between quotes", () => {
      escapeForSlackWithMarkdown('this is "~struck~"').should.equal(
        'this is "<s class="slack_strikethrough">struck</s>"'
      )
    })

    it("should render a normal text with underscores", () => {
      escapeForSlackWithMarkdown('this is a VARIABLE~NAME~TEST').should.equal(
        'this is a VARIABLE~NAME~TEST'
      )
    })
  })

  describe('block quote', () => {
    it('should leave it alone if the block quote delimiter is preceded by non-whitespace content', () => {
      escapeForSlackWithMarkdown('this is not whitespace &gt;&gt;&gt;this is a block quote').should.equal('this is not whitespace &gt;&gt;&gt;this is a block quote');
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
      escapeForSlackWithMarkdown('this is not whitespace &gt;inline quote').should.equal('this is not whitespace &gt;inline quote');
    })

    it('should render an element if the quote delimiter begins the line', () => {
      escapeForSlackWithMarkdown('&gt;inline quote').should.equal('<blockquote class="slack_block">inline quote</blockquote>')
    })

    it('should render an element if the quote delimiter is preceded only by whitespace', () => {
      escapeForSlackWithMarkdown('  \t   &gt;inline quote').should.equal('<blockquote class="slack_block">inline quote</blockquote>')
    })

    it("should render an element if the multiple single line quotes in string", () => {
      escapeForSlackWithMarkdown(
        "&gt;inline quote\n&gt;inline quote"
      ).should.equal(
        '<blockquote class="slack_block">inline quote</blockquote>\n<blockquote class="slack_block">inline quote</blockquote>'
      );
    });

    it("should render an element with multiple multiline quotes in string", () => {
      escapeForSlackWithMarkdown(
        "&gt; Multiline Quote 1 Line 1\n&gt; Multiline Quote 1 Line 2\nNo quote\n&gt; Multiline Quote 2 Line 1\n&gt; Multiline Quote 2 Line 2\nNo Quote\n&gt; Multiline Quote 3 Line 1\n&gt; Multiline Quote 3 Line 2\n"
      ).should.equal(
        '<blockquote class="slack_block"> Multiline Quote 1 Line 1</blockquote>\n<blockquote class="slack_block"> Multiline Quote 1 Line 2</blockquote>\nNo quote\n<blockquote class="slack_block"> Multiline Quote 2 Line 1</blockquote>\n<blockquote class="slack_block"> Multiline Quote 2 Line 2</blockquote>\nNo Quote\n<blockquote class="slack_block"> Multiline Quote 3 Line 1</blockquote>\n<blockquote class="slack_block"> Multiline Quote 3 Line 2</blockquote>\n'
      );
    });
  })

  describe('URL links', () => {
    it("should convert S3 URLs to clickable links", () => {
      escapeForSlackWithMarkdown(
        `<s3://bucket-name/path/to/file.txt> test`
      ).should.equal(
        '<a href="s3://bucket-name/path/to/file.txt" target="_blank" rel="noopener noreferrer">s3://bucket-name/path/to/file.txt</a> test'
      );
    });

    it("should convert FTP URLs to clickable links", () => {
      escapeForSlackWithMarkdown(
        `<ftp://example.com/path/to/file.txt> test`
      ).should.equal(
        '<a href="ftp://example.com/path/to/file.txt" target="_blank" rel="noopener noreferrer">ftp://example.com/path/to/file.txt</a> test'
      );
    });

    it("should convert HTTP URLs to clickable links", () => {
      escapeForSlackWithMarkdown(
        `<http://example.com/path/to/page.html> test`
      ).should.equal(
        '<a href="http://example.com/path/to/page.html" target="_blank" rel="noopener noreferrer">http://example.com/path/to/page.html</a> test'
      );
    });
  })

  it("should convert the url to a clickable link with correct url and text", () => {
    escapeForSlackWithMarkdown(
     `<http://s3://somes3yrl.env|ftp://user:password@server/pathname>`
    ).should.equal(
      '<a href="http://s3://somes3yrl.env" target="_blank" rel="noopener noreferrer">ftp://user:password@server/pathname</a>'
    );
  });
})




  
