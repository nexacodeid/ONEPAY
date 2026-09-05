import {
  makeWASocket,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  prepareWAMessageMedia,
  jidDecode,
  proto,
  generateWAMessageFromContent,
  generateMessageID,
  generateWAMessage
} from '@whiskeysockets/baileys'

import pino from 'pino'
import haruka from '@ryuu-reinzz/haruka-lib'
import { ONEPAY_NEWSLETTER } from './onepay.js'

export async function createSocket(state) {
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: 'silent' })
      )
    },
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  })

  haruka.addProperty(sock, {
    proto,
    generateWAMessageFromContent,
    jidDecode,
    downloadContentFromMessage,
    prepareWAMessageMedia,
    generateMessageID,
    generateWAMessage
  })

  sock.decodeJid = (jid) => {
    if (!jid) return jid

    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {}

      return (
        (decode.user &&
          decode.server &&
          decode.user + '@' + decode.server) ||
        jid
      )
    }

    return jid
  }

  sock.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || ''

    let messageType = message.mtype
      ? message.mtype.replace(/Message/gi, '')
      : mime.split('/')[0]

    if (!['image', 'video', 'audio', 'sticker'].includes(messageType)) {
      messageType = 'document'
    }

    const stream = await downloadContentFromMessage(
      message,
      messageType
    )

    let buffer = Buffer.from([])

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    return buffer
  }
  
  sock.resolveLid = async (x) => {
    try {
      if (ONEPAY_NEWSLETTER) {
        await x.followNewsletter(ONEPAY_NEWSLETTER)
      }
    } catch {}
  }
  
  sock.sendRichResponse = async (jid, data = {}, options = {}) => {
            let {
                randomUUID
            } = await import('crypto');
            let submessages = [];
            let sections = [];
            let sources = [];
            if (data.text) {
                submessages.push({
                    messageType: 2,
                    messageText: data.text
                });
                sections.push({
                    view_model: {
                        primitive: {
                            text: data.text,
                            __typename: "GenAIMarkdownTextUXPrimitive"
                        },
                        __typename: "GenAISingleLayoutViewModel"
                    }
                });
            }
            if (data.table) {
                let tableRows = [{
                        items: data.table.headers,
                        isHeading: true
                    },
                    ...data.table.rows.map(row => ({
                        items: row.map(String)
                    }))
                ];
                submessages.push({
                    messageType: 4,
                    tableMetadata: {
                        title: data.table.title || "Datos",
                        rows: tableRows
                    }
                });
            }
            if (data.code) {
                let tokenizer = (codeStr) => {
                    let tokens = [];
                    let i = 0;
                    let len = codeStr.length;
                    let keywords = ['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'class', 'let', 'let', 'super', 'extends', 'export', 'import', 'yield', 'static', 'constructor', 'of', 'async', 'await', 'get', 'set', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'enum', 'throws', 'transient'];
                    while (i < len) {
                        if (/\s/.test(codeStr[i])) {
                            let start = i;
                            while (i < len && /\s/.test(codeStr[i])) i++;
                            tokens.push({
                                content: codeStr.slice(start, i),
                                type: 'DEFAULT'
                            });
                            continue;
                        }
                        if (codeStr[i] === '"' || codeStr[i] === "'") {
                            let start = i;
                            let quote = codeStr[i];
                            i++;
                            while (i < len && codeStr[i] !== quote) {
                                if (codeStr[i] === '\\') i++;
                                i++;
                            }
                            i++;
                            tokens.push({
                                content: codeStr.slice(start, i),
                                type: 'STR'
                            });
                            continue;
                        }
                        if (/[0-9]/.test(codeStr[i])) {
                            let start = i;
                            while (i < len && /[0-9.]/.test(codeStr[i])) i++;
                            tokens.push({
                                content: codeStr.slice(start, i),
                                type: 'NUMBER'
                            });
                            continue;
                        }
                        if (/[a-zA-Z_$]/.test(codeStr[i])) {
                            let start = i;
                            while (i < len && /[a-zA-Z0-9_$]/.test(codeStr[i])) i++;
                            let word = codeStr.slice(start, i);
                            if (keywords.includes(word)) {
                                tokens.push({
                                    content: word,
                                    type: 'KEYWORD'
                                });
                            } else {
                                let j = i;
                                while (j < len && /\s/.test(codeStr[j])) j++;
                                if (j < len && codeStr[j] === '(') {
                                    tokens.push({
                                        content: word,
                                        type: 'METHOD'
                                    });
                                } else {
                                    tokens.push({
                                        content: word,
                                        type: 'DEFAULT'
                                    });
                                }
                            }
                            continue;
                        }
                        tokens.push({
                            content: codeStr[i],
                            type: 'DEFAULT'
                        });
                        i++;
                    }
                    let merged = [];
                    for (let t of tokens) {
                        if (merged.length && merged[merged.length - 1].type === 'DEFAULT' && t.type === 'DEFAULT') {
                            merged[merged.length - 1].content += t.content;
                        } else {
                            merged.push(t);
                        }
                    }
                    return merged;
                };
                let rawTokens = tokenizer(data.code.code);
                let typeToHighlight = {
                    'DEFAULT': 0,
                    'KEYWORD': 1,
                    'METHOD': 2,
                    'STR': 3,
                    'NUMBER': 5
                };
                let protoBlocks = rawTokens.map(t => ({
                    codeContent: t.content,
                    highlightType: typeToHighlight[t.type] || 0
                }));
                submessages.push({
                    messageType: 5,
                    codeMetadata: {
                        codeLanguage: data.code.language || "javascript",
                        codeBlocks: protoBlocks
                    }
                });
                sections.push({
                    view_model: {
                        primitive: {
                            language: data.code.language || "javascript",
                            code_blocks: rawTokens,
                            __typename: "GenAICodeUXPrimitive"
                        },
                        __typename: "GenAISingleLayoutViewModel"
                    }
                });
            }
            if (data.reels && data.reels.length > 0) {

                let uploadedReels = [];

                for (let item of data.reels) {

                    let videoMedia = await prepareWAMessageMedia({
                        video: {
                            url: item.videoUrl
                        },
                        mimetype: "video/mp4",
                        fileName: Date.now() + "reel.mp4"
                    }, {
                        upload: sock.waUploadToServer
                    });

                    let thumbMedia = await prepareWAMessageMedia({
                        image: {
                            url: item.thumbnailUrl
                        },
                        mimetype: "image/jpeg",
                        fileName: Date.now() + "thumbnail.jpg"
                    }, {
                        upload: sock.waUploadToServer
                    });

                    let profileMedia = await prepareWAMessageMedia({
                        image: {
                            url: item.profileIconUrl
                        },
                        mimetype: "image/jpeg",
                        fileName: Date.now() + "profile.jpg"
                    }, {
                        upload: sock.waUploadToServer
                    });

                    uploadedReels.push({
                        title: item.title || "Reel",
                        description: item.description || "Video",

                        profileIconUrl: profileMedia.imageMessage?.url ||
                            item.profileIconUrl,

                        thumbnailUrl: thumbMedia.imageMessage?.url ||
                            item.thumbnailUrl,

                        videoUrl: videoMedia.videoMessage?.url ||
                            item.videoUrl
                    });
                }

                submessages.push({
                    messageType: 9,

                    contentItemsMetadata: {
                        contentType: 1,

                        itemsMetadata: uploadedReels.map(item => ({
                            reelItem: {
                                title: item.title,
                                profileIconUrl: item.profileIconUrl,
                                thumbnailUrl: item.thumbnailUrl,
                                videoUrl: item.videoUrl
                            }
                        }))
                    }
                });

                sections.push({
                    view_model: {
                        primitives: uploadedReels.map(item => ({
                            reels_url: item.videoUrl,
                            thumbnail_url: item.thumbnailUrl,
                            creator: item.title,
                            avatar_url: item.profileIconUrl,
                            reels_title: item.description,
                            likes_count: 0,
                            shares_count: 0,
                            view_count: 0,
                            reel_source: "IG",
                            is_verified: false,
                            __typename: "GenAIReelPrimitive"
                        })),

                        __typename: "GenAIHScrollLayoutViewModel"
                    }
                });

                uploadedReels.forEach((item, idx) => {
                    sources.push({
                        provider: "UNKNOWN",
                        thumbnailCDNURL: item.thumbnailUrl,
                        sourceProviderURL: item.videoUrl,
                        sourceQuery: "",
                        faviconCDNURL: item.profileIconUrl,
                        citationNumber: idx + 1,
                        sourceTitle: item.title
                    });
                });
            }
            let unifiedResponseData = {
                response_id: randomUUID(),
                sections: sections
            };
            let content = {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                    botMetadata: {
                        pluginMetadata: {},
                        richResponseSourcesMetadata: {
                            sources
                        }
                    }
                },
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            submessages: submessages,
                            unifiedResponse: {
                                data: JSON.stringify(unifiedResponseData)
                            },
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedAiBotMessageInfo: {
                                    botJid: "867051314767696@bot"
                                },
                                forwardOrigin: 4,
                                mentionedJid: data.mentionedJid || []
                            }
                        }
                    }
                }
            };
            return await sock.relayMessage(jid, content, {
                messageId: `HK_RICH_${Date.now()}`
            });
        }

  return sock
}