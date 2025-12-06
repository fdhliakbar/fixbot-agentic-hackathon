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
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import MicIcon from '@material-ui/icons/Mic';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const useStyles = makeStyles(theme => ({
    root: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#212121',
        maxWidth: '100%',
        margin: '0 auto',
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
        lineHeight: 1.6,
        maxWidth: '100%',
        wordBreak: 'break-word',
        '& p': {
            margin: 0,
            marginBottom: theme.spacing(1),
        },
        '& strong': {
            fontWeight: 600,
            color: '#ffffff',
        },
        '& ul, & ol': {
            marginLeft: theme.spacing(2.5),
            marginBottom: theme.spacing(1),
            marginTop: theme.spacing(0.5),
        },
        '& li': {
            marginBottom: theme.spacing(0.5),
        },
        '& h1, & h2, & h3': {
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(1),
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
        lineHeight: 1.6,
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
    const backendUrl = configApi.getString('backend.baseUrl');

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
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

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${backendUrl}/api/fixbot/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    conversationHistory: messages,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
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
            setAttachedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            setAttachedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const parseMarkdown = (text: string) => {
        // Split by code blocks first
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
            }
            parts.push({
                type: 'code',
                content: match[2],
                language: match[1] || 'text'
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
        formatted = formatted.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1rem; font-weight: 600; margin: 12px 0 8px 0; color: #ececf1;">$1</h3>');
        formatted = formatted.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.3rem; font-weight: 600; margin: 16px 0 10px 0; color: #ececf1;">$1</h2>');
        formatted = formatted.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5rem; font-weight: 700; margin: 20px 0 12px 0; color: #ececf1;">$1</h1>');

        // Bold (**text**)
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: #ececf1;">$1</strong>');

        // Italic (*text*)
        formatted = formatted.replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>');

        // Inline code (`code`)
        formatted = formatted.replace(/`([^`]+)`/g, '<code style="background-color: #3d3d3d; padding: 2px 6px; border-radius: 4px; font-family: Consolas, Monaco, monospace; font-size: 0.9em; color: #e06c75;">$1</code>');

        // Lists (- item or * item)
        formatted = formatted.replace(/^\s*[-*]\s+(.+)$/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>');
        formatted = formatted.replace(/(<li.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 0;">$1</ul>');

        // Numbered lists (1. item)
        formatted = formatted.replace(/^\s*\d+\.\s+(.+)$/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>');

        // Line breaks
        formatted = formatted.replace(/\n/g, '<br/>');

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
                                        {part.language || 'code'}
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
                                    <code>{part.content}</code>
                                </pre>
                            </Box>
                        ) : (
                            <Typography
                                key={i}
                                variant="body1"
                                component="div"
                                dangerouslySetInnerHTML={{ __html: formatText(part.content) }}
                                style={{
                                    '& > *:first-child': { marginTop: 0 },
                                    '& > *:last-child': { marginBottom: 0 }
                                }}
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    };

    return (
        <Box className={classes.root}>
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', marginBottom: 1.5 }}>
                        {attachedFiles.map((file, index) => (
                            <Box key={index} className={classes.attachedFile}>
                                <Typography style={{ fontSize: '0.85rem' }}>
                                    📄 {file.name}
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
                    <Tooltip title="Attach File">
                        <IconButton
                            size="small"
                            className={classes.uploadButton}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <AttachFileIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {/* Folder Upload Button */}
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        className={classes.hiddenInput}
                        onChange={handleFolderUpload}
                        // @ts-ignore - webkitdirectory is not in the standard types
                        webkitdirectory=""

                    />
                    <Tooltip title="Attach Folder">
                        <IconButton
                            size="small"
                            className={classes.uploadButton}
                            onClick={() => folderInputRef.current?.click()}
                        >
                            <FolderOpenIcon fontSize="small" />
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

                    {/* Voice Input Button */}
                    <Tooltip title="Voice Input">
                        <IconButton
                            size="small"
                            className={classes.uploadButton}
                        >
                            <MicIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {/* Send Button */}
                    <IconButton
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className={classes.sendButton}
                        size="small"
                    >
                        <SendIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};