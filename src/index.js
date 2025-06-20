import XRegExp from 'xregexp/src/index'
import emoji from './emoji'

/* eslint-disable no-template-curly-in-string */

const expandEmoji = (text, customEmoji) => {
  const allEmoji = Object.assign({}, emoji, customEmoji)
  return text.replace(/:(\S+?):/g, (match, originalKey) => {
    const aliasPattern = /alias:(\S+)/
    let key = originalKey
    let emojiValue

    for (;;) {
      emojiValue = allEmoji[key]
      if (!emojiValue || !emojiValue.match(aliasPattern)) {
        break
      }
      key = emojiValue.replace(aliasPattern, '$1')
    }

    if (key && emojiValue) {
      if (emojiValue.match(/https?:\/\/\S+/)) {
        return `<img alt="${originalKey}" src="${emojiValue}" title=":${originalKey}:" class="slack_emoji" />`
      }

      const emojiHtml = emojiValue
        .split('-')
        .map((emojiCode) => `&#x${emojiCode};`)
        .join('')
      return `<span title=":${originalKey}:">${emojiHtml}</span>`
    }
    return match // if emoji not found then return original
  })
}

const closingDivPatternString = '</div>'
const closingSpanPatternString = '</span>'
const codeDivOpeningPatternString = '<div class="slack_code">'
const codeSpanOpeningPatternString = '<span class="slack_code">'
const openingCodePatternString = '<code>'
const closingCodePatternString = '</code>'
const boldOpeningPatternString = '<strong class="slack_bold">'
const boldClosingPatternString = '</strong>'
const strikethroughOpeningPatternString = '<s class="slack_strikethrough">'
const strikethroughClosingPatternString = '</s>'
const italicOpeningPatternString = '<em class="slack_italics">'
const italicClosingPatternString = '</em>'
const blockDivOpeningPatternString = '<div class="slack_block">'
const blockSpanOpeningPatternString = '<blockquote class="slack_block">'
const blockSpanClosingPatternString = '</blockquote>'
const lineBreakTagLiteral = '<br>'
const newlineRegExp = XRegExp.cache('\\n', 'nsg')
const whitespaceRegExp = XRegExp.cache('\\s', 'ns')
const slackMrkdwnCharactersRegExp = XRegExp.cache('(?<mrkdwnCharacter>[\\*\\`\\~\\_]|&gt;)', 'ng')
const slackMrkdwnPercentageCharsMap = {
  '*': '%2A',
  '&gt;': '%26gt;',
  '`': '%27',
  '~': '%7E',
  _: '%5F'
}
// https://api.slack.com/docs/message-formatting
const userMentionRegExp = XRegExp.cache(
  '<@(((?<userID>[U|W][^|>]+)(\\|(?<userName>[^>]+))?)|(?<userNameWithoutID>[^>]+))>',
  'ng'
)
const channelMentionRegExp = XRegExp.cache(
  '<#(((?<channelID>C[^|>]+)(\\|(?<channelName>[^>]*))?)|(?<channelNameWithoutID>[^>]+))>',
  'ng'
)
const linkRegExp = XRegExp.cache(
  '<(?<linkUrl>(https?|s3|ftp):[^|>]+)(\\|(?<linkHtml>[^>]+))?>',
  'ng'
)
const mailToRegExp = XRegExp.cache(
  '<mailto:(?<mailTo>[^|>]+)(\\|(?<mailToName>[^>]+))?>',
  'ng'
)
const telRegExp = XRegExp.cache(
  '<tel:(?<tel>[^|>]+)(\\|(?<telName>[^>]+))?>',
  'ng'
)
const subteamCommandRegExp = XRegExp.cache(
  '<!subteam\\^(?<subteamID>S[^|>]+)(\\|(?<subteamName>[^>]+))?>',
  'ng'
)
const commandRegExp = XRegExp.cache(
  '<!(?<commandLiteral>[^|>]+)(\\|(?<commandName>[^>]+))?>',
  'ng'
)
const knownCommands = ['here', 'channel', 'group', 'everyone']

const escapeTags = (string) =>
  ['&lt;', string.substring(1, string.length - 1), '&gt;'].join('')

const replaceUserName = (users) => (match) => {
  const userName =
    match.userName ||
    match.userNameWithoutID ||
    (match.userID && users && users[match.userID])
  if (userName) {
    return `<span class="user-mention">@${userName}</span>`
  }
  return escapeTags(match.toString())
}

const replaceChannelName = (channels) => (match) => {
  const channelName =
    match.channelName ||
    match.channelNameWithoutID ||
    (match.channelID && channels && channels[match.channelID])
  if (channelName) {
    return `#${channelName}`
  }
  return escapeTags(match.channelID ? `<#${match.channelID}>` : match.toString())
}

const replaceUserGroupName = (usergroups) => (match) => {
  const userGroupName =
    match.subteamName ||
    (match.subteamID && usergroups && usergroups[match.subteamID])
  if (userGroupName) {
    return `@${userGroupName}`
  }
  return escapeTags(match.toString())
}

const buildOpeningDelimiterRegExp = (
  delimiter,
  { prefixPattern = '', spacePadded = false, escapeDelimiter = true } = {}
) => {
  const escapedDelimiter = escapeDelimiter
    ? XRegExp.escape(delimiter)
    : delimiter
  const prefixRegexPart = spacePadded ? '(?<openingCapturedWhitespace>^|\\s|["\'])' : ''
  return XRegExp.cache(
    `${prefixRegexPart}${prefixPattern}${escapedDelimiter}`,
    'ns'
  )
}

// We can't perform negative lookahead to capture the last consecutive delimiter
// since delimiters can be more than once character long
const buildClosingDelimiterRegExp = (
  delimiter,
  { spacePadded = false, escapeDelimiter = true } = {}
) => {
  const escapedDelimiter = escapeDelimiter
    ? XRegExp.escape(delimiter)
    : delimiter
  const suffixRegexPart = spacePadded ? '(?<closingCapturedWhitespace>\\s|["\']|$)' : ''
  return XRegExp.cache(
    `${escapedDelimiter}${suffixRegexPart}`,
    'ns'
  )
}

const incrementWindows = (windows, offset) => {
  windows.forEach((tagWindow) => {
    tagWindow[0] += offset
    tagWindow[1] += offset
  })
  return windows
}

const replaceInWindows = (
  text,
  delimiterLiteral,
  replacementOpeningLiteral,
  replacementClosingLiteral,
  closedTagWindows,
  options = {},
  tagWindowIndex = 0,
  tagWindowOffset = 0
) => {
  const partitionWindowOnMatch = options.partitionWindowOnMatch
  const spacePadded = options.spacePadded
  const asymmetric = options.endingPattern
  const replaceNewlines = options.replaceNewlines
  let maxReplacements = options.maxReplacements

  const openingDelimiterRegExp = buildOpeningDelimiterRegExp(delimiterLiteral, {
    spacePadded,
    prefixPattern: options.prefixPattern,
  })
  const closingDelimiterRegExp = asymmetric
    ? buildClosingDelimiterRegExp(options.endingPattern, {
      escapeDelimiter: false,
    })
    : buildClosingDelimiterRegExp(delimiterLiteral, { spacePadded })

  if (
    tagWindowIndex >= closedTagWindows.length ||
    (maxReplacements && maxReplacements <= 0)
  ) {
    return {
      text: text,
      windows: closedTagWindows,
    }
  }

  const currentClosedTagWindow = closedTagWindows[tagWindowIndex]
  const tagWindowStartIndex = currentClosedTagWindow[0]
  const tagWindowEndIndex = currentClosedTagWindow[1]
  if (
    tagWindowStartIndex >= tagWindowEndIndex ||
    tagWindowStartIndex + tagWindowOffset > tagWindowEndIndex
  ) {
    return replaceInWindows(
      text,
      delimiterLiteral,
      replacementOpeningLiteral,
      replacementClosingLiteral,
      closedTagWindows,
      options,
      tagWindowIndex + 1
    )
  }

  const openingMatch = XRegExp.exec(
    text,
    openingDelimiterRegExp,
    tagWindowStartIndex + tagWindowOffset
  )

  if (openingMatch && openingMatch.index < tagWindowEndIndex) {
    const closingDelimiterLength = asymmetric ? 0 : delimiterLiteral.length
    // Allow matching the end of the string if on the last window
    const closingMatchMaxIndex =
      (tagWindowIndex === closedTagWindows.length - 1 &&
      tagWindowEndIndex === text.length
        ? tagWindowEndIndex + 1
        : tagWindowEndIndex) -
      closingDelimiterLength +
      1

    // Look ahead at the next index to greedily capture as much inside the delimiters as possible
    let closingMatch = XRegExp.exec(
      text,
      closingDelimiterRegExp,
      openingMatch.index + delimiterLiteral.length
    )
    let nextClosingMatch =
      closingMatch &&
      XRegExp.exec(text, closingDelimiterRegExp, closingMatch.index + 1)
    while (nextClosingMatch) {
      // If the next match is still in the window and there is not whitespace in between the two, use the later one
      const nextWhitespace = XRegExp.exec(
        text,
        whitespaceRegExp,
        closingMatch.index + delimiterLiteral.length
      )
      const crossedWhitespace =
        nextWhitespace && nextWhitespace.index < closingMatchMaxIndex
      if (nextClosingMatch.index >= closingMatchMaxIndex || crossedWhitespace) {
        break
      }
      closingMatch = nextClosingMatch
      nextClosingMatch = XRegExp.exec(
        text,
        closingDelimiterRegExp,
        closingMatch.index + 1
      )
    }

    if (closingMatch && closingMatch.index < closingMatchMaxIndex) {
      const afterDelimitersIndex = closingMatch.index + closingMatch[0].length
      const textBeforeDelimiter = text.slice(0, openingMatch.index)
      const textAfterDelimiter = text.slice(afterDelimitersIndex)

      const openingReplacementString = `${
        spacePadded ? openingMatch.openingCapturedWhitespace : ''
      }${replacementOpeningLiteral}`
      const closingReplacementString = `${replacementClosingLiteral}${
        spacePadded ? closingMatch.closingCapturedWhitespace : ''
      }${asymmetric ? closingMatch[0] : ''}`

      const textBetweenDelimiters = text.slice(
        openingMatch.index + openingMatch[0].length,
        closingMatch.index
      )

      if (textBetweenDelimiters.length === 0) {
        /**
         * If there is an isolated delimiter, then we don't want to replace
         * it with a corresponding opening and closing tag as we want to
         * keep it as is.
         */
        return replaceInWindows(
          text,
          delimiterLiteral,
          replacementOpeningLiteral,
          replacementClosingLiteral,
          closedTagWindows,
          options,
          tagWindowIndex,
          tagWindowOffset + openingMatch[0].length
        )
      }

      const replacedTextBetweenDelimiters = replaceNewlines
        ? XRegExp.replace(
            textBetweenDelimiters,
            newlineRegExp,
            lineBreakTagLiteral
          )
        : textBetweenDelimiters

      const replacedDelimiterText = [
        openingReplacementString,
        replacedTextBetweenDelimiters,
        closingReplacementString,
      ].join('')

      const delimiterReplacementLength =
        delimiterLiteral.length + closingDelimiterLength
      const windowOffset =
        replacementOpeningLiteral.length +
        replacementClosingLiteral.length -
        delimiterReplacementLength +
        replacedTextBetweenDelimiters.length -
        textBetweenDelimiters.length
      const newUpperWindowLimit = tagWindowEndIndex + windowOffset

      const nextWindowIndex = partitionWindowOnMatch
        ? tagWindowIndex + 1
        : tagWindowIndex
      const nextTagWindowOffset = partitionWindowOnMatch
        ? 0
        : afterDelimitersIndex + windowOffset - tagWindowStartIndex + 1
      if (partitionWindowOnMatch) {
        // Split the current window into two by the occurrence of the delimiter pair
        currentClosedTagWindow[1] = openingMatch.index
        closedTagWindows.splice(nextWindowIndex, 0, [
          closingMatch.index + closingDelimiterLength + windowOffset,
          newUpperWindowLimit,
        ])
      } else {
        currentClosedTagWindow[1] = newUpperWindowLimit
      }
      incrementWindows(
        closedTagWindows.slice(nextWindowIndex + 1),
        windowOffset
      )
      maxReplacements -= 1

      return replaceInWindows(
        [textBeforeDelimiter, replacedDelimiterText, textAfterDelimiter].join(
          ''
        ),
        delimiterLiteral,
        replacementOpeningLiteral,
        replacementClosingLiteral,
        closedTagWindows,
        Object.assign({}, options, { maxReplacements }),
        nextWindowIndex,
        nextTagWindowOffset
      )
    }
  }

  return replaceInWindows(
    text,
    delimiterLiteral,
    replacementOpeningLiteral,
    replacementClosingLiteral,
    closedTagWindows,
    options,
    tagWindowIndex + 1
  )
}

/**
 * Custom logic for blockquotes is required because:
 * 1. Blockquotes can span multiple lines
 * 2. Each line of a blockquote starts with '>' (represented as '&gt;' in HTML)
 * 3. We need to wrap each blockquote line individually, rather than the entire block
 * 4. The existing replaceInWindows function doesn't handle this multi-line scenario well
 */
const replaceBlockQuotes = (text) => {
  const lines = text.split('\n')

  const processedLines = lines.map((line) => {
    if (line.trim().startsWith('&gt;')) {
      return replaceInWindows(
        line,
        '&gt;',
        blockSpanOpeningPatternString,
        blockSpanClosingPatternString,
        [[0, line.length]],
        {
          prefixPattern: '^\\s*',
          endingPattern: '\\n|$',
          maxReplacements: 1,
        }
      ).text
    }
    return line
  })

  return processedLines.join('\n')
}

const expandText = (text) => {
  let expandedTextAndWindows
  expandedTextAndWindows = { text: text, windows: [[0, text.length]] }
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '```',
    codeDivOpeningPatternString + openingCodePatternString,
    closingCodePatternString + closingDivPatternString,
    expandedTextAndWindows.windows,
    { partitionWindowOnMatch: true, replaceNewlines: true }
  )
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '`',
    codeSpanOpeningPatternString + openingCodePatternString,
    closingCodePatternString + closingSpanPatternString,
    expandedTextAndWindows.windows,
    { partitionWindowOnMatch: true }
  )
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '*',
    boldOpeningPatternString,
    boldClosingPatternString,
    expandedTextAndWindows.windows,
    { maxReplacements: 100, spacePadded: true, }
  )
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '~',
    strikethroughOpeningPatternString,
    strikethroughClosingPatternString,
    expandedTextAndWindows.windows,
    { maxReplacements: 100, spacePadded: true, }
  )
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '_',
    italicOpeningPatternString,
    italicClosingPatternString,
    expandedTextAndWindows.windows,
    { maxReplacements: 100, spacePadded: true }
  )
  expandedTextAndWindows = replaceInWindows(
    expandedTextAndWindows.text,
    '&gt;&gt;&gt;',
    blockDivOpeningPatternString,
    closingDivPatternString,
    expandedTextAndWindows.windows,
    {
      prefixPattern: '^\\s*',
      endingPattern: '$',
      replaceNewlines: true,
      maxReplacements: 100,
    }
  )

  return replaceBlockQuotes(expandedTextAndWindows.text)
}

const encodeSlackMrkdwnCharactersInLinks = (link) => XRegExp.replace(link, slackMrkdwnCharactersRegExp, (match) => slackMrkdwnPercentageCharsMap[match.mrkdwnCharacter] || match.mrkdwnCharacter)
const escapeForSlack = (text, options = {}) => {
  const customEmoji = options.customEmoji || {}
  const users = options.users || {}
  const channels = options.channels || {}
  const usergroups = options.usergroups || {}
  const markdown = options.markdown || false
  /** Links can contain characters such as *_&~` that are a part of the character set used by
   * Slack Mrkdwn so before converting slack mrkdwn to html we need to encode these characters
  */
  const textWithEncodedLink = XRegExp.replace(text || '',
    linkRegExp,
    (match) => {
      const encodedLink = encodeSlackMrkdwnCharactersInLinks(match.linkUrl)
      return `<a href="${encodedLink
      }" target="_blank" rel="noopener noreferrer">${match.linkHtml || encodedLink
      }</a>`
    })
  const expandedText = markdown ? expandText(textWithEncodedLink) : textWithEncodedLink
  return expandEmoji(
    XRegExp.replaceEach(expandedText, [
      [userMentionRegExp, replaceUserName(users)],
      [channelMentionRegExp, replaceChannelName(channels)],
      [
        mailToRegExp,
        (match) =>
          `<a href="mailto:${
            match.mailTo
          }" target="_blank" rel="noopener noreferrer">${
            match.mailToName || match.mailTo
          }</a>`,
      ],
      [
        telRegExp,
        (match) =>
          `<a href="tel:${match.tel}">${match.telName || match.tel}</a>`,
      ],
      [subteamCommandRegExp, replaceUserGroupName(usergroups)],
      [
        commandRegExp,
        (match) => {
          if (
            match.commandLiteral &&
            match.commandLiteral.startsWith('subteam')
          ) {
            return match.toString()
          } else if (knownCommands.includes(match.commandLiteral)) {
            return `@${match.commandLiteral}`
          } else if (match.commandName) {
            return `<${match.commandName}>`
          }
          return `<${match.commandLiteral}>`
        },
      ],
    ]),
    customEmoji
  )
}

const escapeForSlackWithMarkdown = (text, options = {}) => {
  return escapeForSlack(text, Object.assign({}, options, { markdown: true }))
}

const buildSlackHawkDownRegExps = () => {
  return {
    userMentionRegExp: userMentionRegExp,
    channelMentionRegExp: channelMentionRegExp,
    linkRegExp: linkRegExp,
    mailToRegExp: mailToRegExp,
    telRegExp: telRegExp,
    subteamCommandRegExp: subteamCommandRegExp,
    boldOpeningDelimiterRegExp: buildOpeningDelimiterRegExp('*'),
    boldClosingDelimiterRegExp: buildClosingDelimiterRegExp('*'),
    italicsOpeningDelimiterRegExp: buildOpeningDelimiterRegExp('_', {
      spacePadded: true,
    }),
    italicsClosingDelimiterRegExp: buildClosingDelimiterRegExp('_', {
      spacePadded: true,
    }),
    strikethroughOpeningDelimiterRegExp: buildOpeningDelimiterRegExp('~'),
    strikethroughClosingDelimiterRegExp: buildClosingDelimiterRegExp('~'),
    blockDivOpeningDelimiterRegExp: buildOpeningDelimiterRegExp('&gt;&gt;&gt;'),
    blockDivClosingDelimiterRegExp: buildClosingDelimiterRegExp('$', {
      escapeDelimiter: false,
    }),
    blockSpanOpeningDelimiterRegExp: buildOpeningDelimiterRegExp('&gt;'),
    blockSpanClosingDelimiterRegExp: buildClosingDelimiterRegExp('\\n|$', {
      escapeDelimiter: false,
    }),
  }
}

module.exports = {
  escapeForSlack: escapeForSlack,
  escapeForSlackWithMarkdown: escapeForSlackWithMarkdown,
  buildSlackHawkDownRegExps: buildSlackHawkDownRegExps,
}
