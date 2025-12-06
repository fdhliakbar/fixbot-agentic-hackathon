import { useState, useRef } from 'react';
import {
    Box,
    TextField,
    Typography,
    List,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import PersonIcon from '@material-ui/icons/Person';
import DeleteIcon from '@material-ui/icons/Delete';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useApi, configApiRef, identityApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { ChatHistorySidebar } from './ChatHistorySidebar';

const useStyles = makeStyles(theme => ({
    root: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#212121',
        maxWidth: '100%',
        margin: '0 auto',
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #2d2d2d',
        padding: theme.spacing(2, 3),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 60,
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
    },
    logo: {
        width: 32,
        height: 32,
        objectFit: 'contain',
    },
    headerTitle: {
        color: '#ececf1',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '0.3px',
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    modelChip: {
        backgroundColor: '#2a2b32',
        color: '#ececf1',
        fontSize: '0.75rem',
        fontWeight: 500,
        height: 28,
        border: '1px solid #151517',
        '& .MuiChip-label': {
            padding: '0 8px',
        },
    },
    chatContainer: {
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#212121',
        display: 'flex',
        flexDirection: 'column',
        '&::-webkit-scrollbar': {
            width: 8,
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: '#212121',
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#3d3d3d',
            borderRadius: 4,
        },
    },
    messageList: {
        padding: 0,
        maxWidth: 800,
        margin: '0 auto',
        width: '100%',
    },
    message: {
        display: 'flex',
        padding: theme.spacing(3, 2),
        gap: theme.spacing(2),
        alignItems: 'flex-start',

    },
    '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(4px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
    userMessage: {
        backgroundColor: '#343541',
    },
    assistantMessageBg: {
        backgroundColor: '#2a2a2a',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 4,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiAvatar: {
        backgroundColor: '#19c37d',
        padding: 4,
    },
    userAvatar: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    messageContent: {
        flex: 1,
        color: '#ececf1',
        fontSize: '0.95rem',
        lineHeight: 1.5,
        maxWidth: '100%',
        wordBreak: 'break-word',
        '& .MuiTypography-root': {
            margin: 0,
        },
        '& div': {
            marginBottom: 8,
            lineHeight: 1.5,
        },
        '& p': {
            margin: '8px 0',
            lineHeight: 1.5,
        },
        '& strong': {
            fontWeight: 600,
            color: '#ffffff',
        },
        '& ul, & ol': {
            margin: '8px 0 12px 20px',
            paddingLeft: 20,
            lineHeight: 1.5,
        },
        '& li': {
            marginBottom: 4,
            lineHeight: 1.5,
        },
        '& h1, & h2, & h3': {
            marginTop: theme.spacing(2.5),
            marginBottom: theme.spacing(1.5),
            lineHeight: 1.4,
        },
    },
    codeBlockContainer: {
        position: 'relative',
        marginTop: theme.spacing(1.5),
        marginBottom: theme.spacing(1),
        borderRadius: 8,
        overflow: 'hidden',
    },
    codeBlockHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2d2d2d',
        padding: theme.spacing(1, 2),
        borderBottom: '1px solid #3d3d3d',
    },
    codeLanguage: {
        color: '#8e8ea0',
        fontSize: '0.75rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    copyButton: {
        color: '#8e8ea0',
        padding: 4,
        '&:hover': {
            color: '#ececf1',
            backgroundColor: '#3d3d3d',
        },
    },
    codeBlock: {
        backgroundColor: '#565656',
        color: '#e5e5e5',
        padding: theme.spacing(2),
        margin: 0,
        overflow: 'auto',
        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        maxWidth: '100%',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        '& code': {
            color: '#e5e5e5',
            '& .keyword': { color: '#c678dd' },
            '& .string': { color: '#98c379' },
            '& .comment': { color: '#7f848e', fontStyle: 'italic' },
            '& .function': { color: '#61afef' },
            '& .number': { color: '#d19a66' },
            '& .operator': { color: '#56b6c2' },
            '& .variable': { color: '#e06c75' },
            '& .tag': { color: '#e06c75' },
            '& .attr': { color: '#d19a66' },
        },
        '&::-webkit-scrollbar': {
            height: 8,
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#3d3d3d',
            borderRadius: 4,
        },
    },
    inputContainer: {
        backgroundColor: '#212121',
        padding: theme.spacing(3),
        borderTop: 'none',
        maxWidth: 900,
        margin: '0 auto',
        width: '100%',
    },
    inputWrapper: {
        display: 'flex',
        gap: theme.spacing(1),
        alignItems: 'center',
        backgroundColor: '#2d2d2d',
        borderRadius: 24,
        padding: theme.spacing(1.5, 2),
        border: '1px solid #3d3d3d',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    },
    textField: {
        flex: 1,
        '& .MuiInputBase-root': {
            color: '#ececf1',
            fontSize: '0.95rem',
            padding: 0,
        },
        '& .MuiInput-underline:before': {
            borderBottom: 'none',
        },
        '& .MuiInput-underline:after': {
            borderBottom: 'none',
        },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
            borderBottom: 'none',
        },
        '& textarea': {
            color: '#ececf1',
            '&::placeholder': {
                color: '#8e8ea0',
                opacity: 1,
            },
        },
    },
    sendButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        minWidth: 36,
        width: 36,
        height: 36,
        padding: 0,
        borderRadius: '50%',
        '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
        },
        '&:disabled': {
            backgroundColor: '#3d3d3d',
            color: '#6e6e80',
            background: 'none',
        },
    },
    clearButton: {
        color: '#ececf1',

    },
    loadingContainer: {
        display: 'flex',
        padding: theme.spacing(3, 2),
        gap: theme.spacing(2),
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: theme.spacing(2),
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: theme.spacing(1),
    },
    emptyStateTitle: {
        color: '#ececf1',
        fontSize: '1.75rem',
        fontWeight: 500,
    },
    actionButton: {
        color: '#8e8ea0',
        '&:hover': {
            backgroundColor: '#2d2d2d',
            color: '#ececf1',
        },
    },
    uploadButton: {
        color: '#8e8ea0',
        '&:hover': {
            color: '#ececf1',
        },
    },
    hiddenInput: {
        display: 'none',
    },
    attachedFile: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        backgroundColor: '#3d3d3d',
        padding: theme.spacing(0.5, 1.5),
        borderRadius: 16,
        fontSize: '0.85rem',
        color: '#ececf1',
    },
    loadingText: {
        color: '#ececf1',
        fontSize: '0.9rem',
        fontStyle: 'italic',
    },
}));

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const ChatInterface = () => {
    const classes = useStyles();
    const configApi = useApi(configApiRef);
    const identityApi = useApi(identityApiRef);
    const fetchApi = useApi(fetchApiRef);
    const backendUrl = configApi.getString('backend.baseUrl');

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
    const [userId, setUserId] = useState<string>('anonymous');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get user identity from Backstage
    useState(() => {
        identityApi.getBackstageIdentity().then(identity => {
            setUserId(identity.userEntityRef || 'anonymous');
        }).catch(() => {
            setUserId('anonymous');
        });
    });

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to copy code:', err);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: '👋 Chat cleared! How can I help you?',
                timestamp: new Date(),
            },
        ]);
    };

    const handleSessionSelect = async (sessionId: string) => {
        try {
            setLoading(true);
            // Load messages from the selected session
            const response = await fetchApi.fetch(`${backendUrl}/api/fixbot/sessions/${sessionId}/messages`);

            if (!response.ok) {
                throw new Error('Failed to load session messages');
            }

            const data = await response.json();
            const loadedMessages: Message[] = data.messages.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp || msg.created_at),
            }));

            setMessages(loadedMessages);
            setCurrentSessionId(sessionId);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = async () => {
        try {
            // Create a new session
            const response = await fetchApi.fetch(`${backendUrl}/api/fixbot/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: 'New Chat',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create new session');
            }

            const data = await response.json();
            const newSessionId = data.session?.session_id || data.session_id;
            // eslint-disable-next-line no-console
            console.log('New session created:', newSessionId);
            setCurrentSessionId(newSessionId);
            setMessages([]);
            setInput('');
            setAttachedFiles([]);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to create new session:', error);
        }
    };

    const readFileContent = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                // Limit content to first 5000 characters to avoid huge messages
                resolve(content.slice(0, 5000) + (content.length > 5000 ? '\n... (truncated)' : ''));
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const sendMessage = async () => {
        if (!input.trim() && attachedFiles.length === 0) return;

        // Auto-create session if not exists
        let sessionId = currentSessionId;
        if (!sessionId) {
            try {
                const sessionResponse = await fetchApi.fetch(`${backendUrl}/api/fixbot/sessions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: 'New Chat',
                    }),
                });
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    sessionId = sessionData.session?.session_id || sessionData.session_id;
                    // eslint-disable-next-line no-console
                    console.log('Auto-created session:', sessionId);
                    setCurrentSessionId(sessionId);
                } else {
                    // eslint-disable-next-line no-console
                    console.error('Failed to create session, status:', sessionResponse.status);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to create session:', error);
            }
        }

        // Read file contents if any
        let messageContent = input;
        if (attachedFiles.length > 0) {
            messageContent += '\n\n📎 Attached Files:\n';
            for (const file of attachedFiles) {
                const content = await readFileContent(file);
                messageContent += `\n**${file.name}** (${(file.size / 1024).toFixed(2)} KB):\n\`\`\`\n${content}\n\`\`\`\n`;
            }
        }

        const userMessage: Message = { role: 'user', content: messageContent, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setAttachedFiles([]);
        setLoading(true);

        try {
            // eslint-disable-next-line no-console
            console.log('Sending message with sessionId:', sessionId, 'userId:', userId);

            const response = await fetchApi.fetch(`${backendUrl}/api/fixbot/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageContent,
                    conversationHistory: messages,
                    sessionId: sessionId, // Use the sessionId (either existing or newly created)
                }),
            }); if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            // Update session title if this is the first message in a new session
            if (sessionId && messages.length === 0) {
                // Generate title from first message (first 50 chars)
                const title = messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : '');
                await fetchApi.fetch(`${backendUrl}/api/fixbot/sessions/${sessionId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title }),
                });
            }
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const remainingSlots = 2 - attachedFiles.length;

            if (remainingSlots <= 0) {
                // eslint-disable-next-line no-alert
                window.alert('Maximum 2 files allowed. Please remove existing files first.');
                return;
            }

            const filesToAdd = newFiles.slice(0, remainingSlots);
            setAttachedFiles(prev => [...prev, ...filesToAdd]);

            if (newFiles.length > remainingSlots) {
                // eslint-disable-next-line no-alert
                window.alert(`Only ${remainingSlots} file(s) added. Maximum 2 files allowed.`);
            }
        }
        // Reset input value to allow re-selecting the same file
        event.target.value = '';
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const detectLanguage = (language: string, code: string): string => {
        const lang = language.toLowerCase();

        // Direct language match
        const knownLanguages = [
            'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 'cpp', 'c',
            'csharp', 'cs', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'sql',
            'html', 'css', 'scss', 'sass', 'json', 'xml', 'yaml', 'yml', 'markdown', 'md',
            'bash', 'sh', 'shell', 'powershell', 'dockerfile', 'docker'
        ];

        if (knownLanguages.includes(lang)) {
            return lang;
        }

        // Auto-detect based on code patterns
        if (code.includes('def ') || code.includes('import ') && code.includes(':')) {
            return 'python';
        }
        if (code.includes('function ') || code.includes('const ') || code.includes('=>')) {
            return 'javascript';
        }
        if (code.includes('package ') || code.includes('class ') && code.includes('public static')) {
            return 'java';
        }
        if (code.includes('<?php')) {
            return 'php';
        }
        if (code.includes('func ') || code.includes('package main')) {
            return 'go';
        }
        if (code.includes('<html') || code.includes('<!DOCTYPE')) {
            return 'html';
        }
        if (code.startsWith('{') && code.includes(':')) {
            return 'json';
        }
        if (code.includes('#!/bin/bash') || code.includes('#!/bin/sh')) {
            return 'bash';
        }

        return 'text';
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const highlightSyntax = (code: string, language: string) => {
        const detectedLang = detectLanguage(language, code);

        // Language-specific keywords
        const keywordsByLang: Record<string, string> = {
            javascript: 'const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|super|extends|static',
            typescript: 'const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|super|extends|static|interface|type|enum|namespace',
            python: 'def|class|import|from|return|if|else|elif|for|while|try|except|finally|with|as|pass|break|continue|yield|lambda|async|await|True|False|None',
            java: 'public|private|protected|static|final|class|interface|extends|implements|return|if|else|for|while|try|catch|throw|new|this|super|void|int|string|boolean',
            go: 'func|package|import|var|const|type|struct|interface|return|if|else|for|range|defer|go|chan|select|case|default',
            php: 'function|class|public|private|protected|static|return|if|else|foreach|while|try|catch|throw|new|this|namespace|use',
            bash: 'if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|grep',
            sql: 'SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|ORDER|BY|HAVING|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE',
        };

        const keywordPattern = keywordsByLang[detectedLang] || keywordsByLang.javascript;
        const keywords = new RegExp(`\\b(${keywordPattern})\\b`, 'g');
        const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
        const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$|<!--[\s\S]*?-->)/gm;
        const functions = /\b([a-zA-Z_$][\w$]*)(?=\s*\()/g;
        const numbers = /\b(\d+\.?\d*|0x[\da-fA-F]+)\b/g;

        let highlighted = code;

        // Apply highlighting in order (comments first to avoid conflicts)
        highlighted = highlighted.replace(comments, '<span class="comment">$1</span>');
        highlighted = highlighted.replace(strings, '<span class="string">$1</span>');
        highlighted = highlighted.replace(keywords, '<span class="keyword">$1</span>');
        highlighted = highlighted.replace(functions, '<span class="function">$1</span>');
        highlighted = highlighted.replace(numbers, '<span class="number">$1</span>');

        return highlighted;
    };

    const parseMarkdown = (text: string) => {
        // Split by code blocks first - support more flexible patterns
        const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
        const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
        let lastIndex = 0;
        let match;

        // eslint-disable-next-line no-cond-assign
        while ((match = codeBlockRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
            }
            const detectedLang = detectLanguage(match[1] || 'text', match[2]);
            parts.push({
                type: 'code',
                content: match[2],
                language: detectedLang
            });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push({ type: 'text', content: text.slice(lastIndex) });
        }

        return parts.length > 0 ? parts : [{ type: 'text', content: text }];
    };

    const formatText = (text: string) => {
        // Process markdown formatting
        let formatted = text;

        // Headers (## Header)
        formatted = formatted.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1rem; font-weight: 600; margin: 16px 0 8px 0; color: #ececf1; line-height: 1.4;">$1</h3>');
        formatted = formatted.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.3rem; font-weight: 600; margin: 20px 0 10px 0; color: #ececf1; line-height: 1.4;">$1</h2>');
        formatted = formatted.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5rem; font-weight: 700; margin: 24px 0 12px 0; color: #ececf1; line-height: 1.4;">$1</h1>');

        // Bold (**text**)
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: #ececf1;">$1</strong>');

        // Italic (*text*)
        formatted = formatted.replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>');

        // Inline code (`code`)
        formatted = formatted.replace(/`([^`]+)`/g, '<code style="background-color: #3d3d3d; padding: 2px 6px; border-radius: 4px; font-family: Consolas, Monaco, monospace; font-size: 0.9em; color: #e06c75;">$1</code>');

        // Lists (- item or * item)
        formatted = formatted.replace(/^\s*[-*]\s+(.+)$/gim, '<li style="margin-bottom: 4px; line-height: 1.5;">$1</li>');
        formatted = formatted.replace(/(<li.*?<\/li>(?:\s*<li.*?<\/li>)*)/gs, '<ul style="margin: 8px 0 12px 20px; padding-left: 20px; line-height: 1.5;">$1</ul>');

        // Numbered lists (1. item)
        formatted = formatted.replace(/^\s*\d+\.\s+(.+)$/gim, '<li style="margin-bottom: 4px; line-height: 1.5;">$1</li>');

        // Paragraphs - proper spacing
        // Split by double line breaks to identify true paragraphs
        const paragraphs = formatted.split(/\n\n+/);
        formatted = paragraphs
            .map(para => {
                // Single line breaks within paragraph become spaces (not <br/>)
                const cleaned = para.replace(/\n/g, '<br/>');
                return `<div style="margin-bottom: 8px; line-height: 1.5;">${cleaned}</div>`;
            })
            .join('');

        return formatted;
    };

    const renderMessage = (message: Message, index: number) => {
        const isUser = message.role === 'user';
        const parts = parseMarkdown(message.content);

        return (
            <Box
                key={index}
                className={`${classes.message} ${!isUser ? classes.assistantMessageBg : ''}`}
            >
                {!isUser && (
                    <Avatar className={`${classes.avatar} ${classes.aiAvatar}`}>
                        <img src="/fixbot-logo.png" alt="FixBot" style={{ width: 22, height: 22 }} />
                    </Avatar>
                )}
                {isUser && (
                    <Avatar className={`${classes.avatar} ${classes.userAvatar}`}>
                        <PersonIcon fontSize="small" />
                    </Avatar>
                )}
                <Box className={classes.messageContent}>
                    {parts.map((part, i) => {
                        const codeBlockKey = `${index}-${i}`;
                        const isCopied = copiedIndex === parseInt(codeBlockKey.replace('-', ''), 10);

                        return part.type === 'code' ? (
                            <Box key={i} className={classes.codeBlockContainer}>
                                <Box className={classes.codeBlockHeader}>
                                    <Typography className={classes.codeLanguage}>
                                        {'language' in part ? (part.language || 'code') : 'code'}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        className={classes.copyButton}
                                        onClick={() => copyToClipboard(part.content, parseInt(`${index}${i}`, 10))}
                                        title={isCopied ? 'Copied!' : 'Copy code'}
                                    >
                                        <FileCopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <pre className={classes.codeBlock}>
                                    <code dangerouslySetInnerHTML={{ __html: highlightSyntax(part.content, 'language' in part ? (part.language || 'text') : 'text') }} />
                                </pre>
                            </Box>
                        ) : (
                            <Typography
                                key={i}
                                variant="body1"
                                component="div"
                                dangerouslySetInnerHTML={{ __html: formatText(part.content) }}
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    };

    return (
        <Box className={classes.root}>
            {/* Sidebar with chat history */}
            <ChatHistorySidebar
                userId={userId}
                currentSessionId={currentSessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
            />

            {/* Main chat content */}
            <Box className={classes.mainContent}>
                {/* Clean Header Bar */}
                <Box className={classes.header}>
                    <Box className={classes.headerContent}>
                        <img
                            src="/fixbot-logo.png"
                            alt="FixBot"
                            className={classes.logo}
                        />
                        <Typography className={classes.headerTitle}>
                            FixBot
                        </Typography>
                    </Box>
                    <Box className={classes.headerActions}>
                        <Chip
                            label="Claude Sonnet 4"
                            size="small"
                            className={classes.modelChip}
                        />
                        <Tooltip title="Clear Chat">
                            <IconButton
                                onClick={clearChat}
                                size="small"
                                className={classes.clearButton}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Chat Messages */}
                <Box className={classes.chatContainer}>
                    {messages.length === 0 && !loading ? (
                        <Box className={classes.emptyState}>
                            <img
                                src="/fixbot-logo.png"
                                alt="FixBot"
                                style={{ width: 80, height: 80, marginBottom: 16 }}
                            />
                            <Typography className={classes.emptyStateTitle}>
                                Let me know your problem?
                            </Typography>
                            <Box style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
                                <Typography variant="body2" style={{ color: '#9e9ea7', marginBottom: 8 }}>
                                    💡 Quick Actions:
                                </Typography>
                                <Box style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <Chip
                                        label="🤖 Open AI Agent Panel"
                                        clickable
                                        onClick={() => {
                                            window.location.href = '/fixbot-agent';
                                        }}
                                        style={{ backgroundColor: '#2d2d2d', color: '#ececf1', fontWeight: 500 }}
                                    />
                                    <Chip
                                        label="🔍 Analyze Repository Health"
                                        clickable
                                        onClick={() => setInput('Analyze my repository health score')}
                                        style={{ backgroundColor: '#2d2d2d', color: '#ececf1' }}
                                    />
                                    <Chip
                                        label="📝 Generate README"
                                        clickable
                                        onClick={() => setInput('Help me generate a professional README.md')}
                                        style={{ backgroundColor: '#2d2d2d', color: '#ececf1' }}
                                    />
                                    <Chip
                                        label="🐛 Fix Code Issues"
                                        clickable
                                        onClick={() => setInput('I have some code that needs fixing')}
                                        style={{ backgroundColor: '#2d2d2d', color: '#ececf1' }}
                                    />
                                </Box>
                                <Typography variant="caption" style={{ color: '#6e6e80', marginTop: 12, textAlign: 'center' }}>
                                    Or type your question below to get started
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <List className={classes.messageList}>
                            {messages.map((message, index) => renderMessage(message, index))}
                            {loading && (
                                <Box className={classes.loadingContainer}>
                                    <Avatar className={`${classes.avatar} ${classes.aiAvatar}`}>
                                        <img src="/fixbot-logo.png" alt="FixBot" style={{ width: 22, height: 22 }} />
                                    </Avatar>
                                    <Typography className={classes.loadingText}>
                                        FixBot is thinking...
                                    </Typography>
                                </Box>
                            )}
                        </List>
                    )}
                </Box>

                {/* Input Area */}
                <Box className={classes.inputContainer}>
                    {/* Attached Files */}
                    {attachedFiles.length > 0 && (
                        <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {attachedFiles.map((file, index) => (
                                <Box key={index} className={classes.attachedFile}>
                                    <Typography style={{ fontSize: '0.85rem' }}>
                                        📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => removeFile(index)}
                                        style={{ padding: 2 }}
                                    >
                                        <DeleteIcon style={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}

                    <Box className={classes.inputWrapper}>
                        {/* File Upload Button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className={classes.hiddenInput}
                            onChange={handleFileUpload}
                            accept="*/*"
                        />
                        <Tooltip title={`Attach File (${attachedFiles.length}/2)`}>
                            <IconButton
                                size="small"
                                className={classes.uploadButton}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={attachedFiles.length >= 2}
                            >
                                <AttachFileIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {/* Text Input */}
                        <TextField
                            fullWidth
                            multiline
                            maxRows={6}
                            placeholder="Message FixBot..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            className={classes.textField}
                        />

                        {/* Send Button */}
                        <IconButton
                            onClick={sendMessage}
                            disabled={loading || (!input.trim() && attachedFiles.length === 0)}
                            className={classes.sendButton}
                            size="small"
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};