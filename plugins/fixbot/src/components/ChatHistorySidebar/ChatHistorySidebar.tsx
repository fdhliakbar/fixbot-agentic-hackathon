import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    List,
    ListItem,
    Typography,
    IconButton,
    Divider,
    Tooltip,
    CircularProgress,
    LinearProgress,
    Button,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import ChatIcon from '@material-ui/icons/Chat';
import DeleteIcon from '@material-ui/icons/Delete';
import StorageIcon from '@material-ui/icons/Storage';
import WarningIcon from '@material-ui/icons/Warning';
import { makeStyles } from '@material-ui/core/styles';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';

const useStyles = makeStyles(theme => ({
    root: {
        width: 280,
        height: '100%',
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
    },
    header: {
        padding: theme.spacing(2),
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    newChatButton: {
        width: '100%',
        marginBottom: theme.spacing(1),
        justifyContent: 'flex-start',
        padding: theme.spacing(1.5),
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
    },
    sectionTitle: {
        padding: theme.spacing(1, 2),
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: theme.palette.text.secondary,
        marginTop: theme.spacing(1),
    },
    sessionsList: {
        flex: 1,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
            width: 6,
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.grey[400],
            borderRadius: 3,
        },
    },
    sessionItem: {
        borderRadius: theme.spacing(1),
        margin: theme.spacing(0.5, 1),
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    activeSession: {
        backgroundColor: theme.palette.action.selected,
    },
    sessionTitle: {
        fontSize: '0.875rem',
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    sessionPreview: {
        fontSize: '0.75rem',
        color: theme.palette.text.secondary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    footer: {
        padding: theme.spacing(2),
        borderTop: `1px solid ${theme.palette.divider}`,
    },
    storageBar: {
        marginBottom: theme.spacing(1),
    },
    storageText: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing(0.5),
    },
    warningBox: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        padding: theme.spacing(1),
        backgroundColor: theme.palette.warning.light,
        borderRadius: theme.spacing(0.5),
        marginTop: theme.spacing(1),
    },
    emptyState: {
        padding: theme.spacing(4, 2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
}));

interface Session {
    session_id: string;
    title: string;
    lastMessage: string;
    lastMessageAt: string;
    messageCount: number;
    createdAt: string;
}

interface StorageInfo {
    storageUsed: number;
    storageLimit: number;
    percentage: number;
    isNearLimit: boolean;
    isFull: boolean;
}

interface ChatHistorySidebarProps {
    userId: string;
    currentSessionId?: string;
    onSessionSelect: (sessionId: string) => void;
    onNewChat: () => void;
}

export const ChatHistorySidebar = ({
    userId,
    currentSessionId,
    onSessionSelect,
    onNewChat,
}: ChatHistorySidebarProps) => {
    const classes = useStyles();
    const config = useApi(configApiRef);
    const fetchApi = useApi(fetchApiRef);
    const backendUrl = config.getString('backend.baseUrl'); const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

    const loadSessions = useCallback(async () => {
        try {
            const response = await fetchApi.fetch(
                `${backendUrl}/api/fixbot/sessions/recent?limit=20`
            );
            const data = await response.json();
            setSessions(data.sessions || []);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    }, [backendUrl, fetchApi]); const loadStorageInfo = useCallback(async () => {
        try {
            const response = await fetchApi.fetch(
                `${backendUrl}/api/fixbot/storage-quota`
            );
            const data = await response.json();
            const info = data.quota || data;

            // Ensure percentage is calculated if not present
            if (info && typeof info.percentage !== 'number') {
                const storageUsed = info.storage_used || info.storageUsed || 0;
                const storageLimit = info.storage_limit || info.storageLimit || 52428800;
                info.percentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;
                info.storageUsed = storageUsed;
                info.storageLimit = storageLimit;
                info.isNearLimit = info.percentage > 80;
                info.isFull = info.percentage > 95;
            }

            setStorageInfo(info);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load storage info:', error);
            // Set default storage info on error
            setStorageInfo({
                storageUsed: 0,
                storageLimit: 52428800,
                percentage: 0,
                isNearLimit: false,
                isFull: false,
            });
        }
    }, [backendUrl, fetchApi]); useEffect(() => {
        loadSessions();
        loadStorageInfo();

        // Refresh every 30 seconds
        const interval = setInterval(() => {
            loadSessions();
            loadStorageInfo();
        }, 30000);

        return () => clearInterval(interval);
    }, [loadSessions, loadStorageInfo]);

    const handleDeleteSession = async (sessionId: string, e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        // eslint-disable-next-line no-alert
        if (window.confirm('Delete this chat session?')) {
            try {
                await fetchApi.fetch(`${backendUrl}/api/fixbot/sessions/${sessionId}`, {
                    method: 'DELETE',
                });
                loadSessions();
                loadStorageInfo();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to delete session:', error);
            }
        }
    };

    const getStorageColor = (percentage: number) => {
        if (percentage >= 95) return 'error';
        if (percentage >= 80) return 'warning';
        return 'primary';
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Box className={classes.root}>
            {/* Header */}
            <Box className={classes.header}>
                <Button
                    className={classes.newChatButton}
                    onClick={onNewChat}
                    startIcon={<AddIcon />}
                    variant="contained"
                    fullWidth
                >
                    New Chat
                </Button>
            </Box>

            {/* Sessions List */}
            <Box className={classes.sessionsList}>
                <Typography className={classes.sectionTitle}>Recents</Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <>
                        {sessions.length === 0 ? (
                            <Box className={classes.emptyState}>
                                <ChatIcon style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
                                <Typography variant="body2">No chat history yet</Typography>
                                <Typography variant="caption">Start a new conversation</Typography>
                            </Box>
                        ) : (
                            <List>
                                {sessions.map(session => (
                                    <ListItem
                                        button
                                        key={session.session_id}
                                        className={`${classes.sessionItem} ${currentSessionId === session.session_id ? classes.activeSession : ''
                                            }`}
                                        onClick={() => onSessionSelect(session.session_id)}
                                    >
                                        <ChatIcon style={{ marginRight: 8, fontSize: 18, opacity: 0.7 }} />
                                        <Box style={{ flex: 1, overflow: 'hidden' }}>
                                            <Typography className={classes.sessionTitle}>
                                                {session.title || 'Untitled Chat'}
                                            </Typography>
                                            <Typography className={classes.sessionPreview}>
                                                {session.lastMessage || 'No messages'} • {formatDate(session.lastMessageAt)}
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={e => handleDeleteSession(session.session_id, e)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </>
                )}
            </Box>

            <Divider />

            {/* Footer - Storage Info */}
            <Box className={classes.footer}>
                {storageInfo && storageInfo.percentage !== undefined && (
                    <>
                        <Box className={classes.storageBar}>
                            <Box className={classes.storageText}>
                                <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                                    <StorageIcon fontSize="small" />
                                    <Typography variant="caption" style={{ fontWeight: 600 }}>
                                        Storage
                                    </Typography>
                                </Box>
                                <Typography variant="caption" style={{ fontWeight: 600 }}>
                                    {storageInfo.percentage.toFixed(0)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(storageInfo.percentage, 100)}
                                color={storageInfo.percentage > 80 ? 'secondary' : 'primary'}
                                style={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 4 }}>
                                {formatBytes(storageInfo.storageUsed || 0)} / {formatBytes(storageInfo.storageLimit || 52428800)}
                            </Typography>
                        </Box>

                        {storageInfo.isNearLimit && (
                            <Box className={classes.warningBox}>
                                <WarningIcon fontSize="small" style={{ color: '#f57c00' }} />
                                <Typography variant="caption" style={{ flex: 1 }}>
                                    Storage {storageInfo.isFull ? 'full' : 'almost full'}! Clean up old chats.
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};
