import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
    MessageCircle,
    Heart,
    Trash2,
    Reply,
    Send,
    Sparkles,
    User,
    ChevronDown,
    X,
    ArrowUpDown
} from 'lucide-react';
import './CommentSection.css';

// ─── Sub-component: Comment Form ───
const CommentForm = ({
    isAuthenticated,
    user,
    newComment,
    setNewComment,
    handleSubmit,
    inputFocused,
    setInputFocused,
    showSuperChat,
    setShowSuperChat,
    superChatAmount,
    setSuperChatAmount
}) => {
    if (!isAuthenticated) {
        return (
            <div className="login-prompt">
                <a href="/auth">Sign in</a> to comment
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="yt-comment-form">
            <div className="form-avatar">
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} />
                ) : (
                    <User size={18} />
                )}
            </div>
            <div className="form-input-area">
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                />
                {inputFocused && (
                    <div className="form-actions">
                        <button
                            type="button"
                            className={`super-chat-toggle ${showSuperChat ? 'active' : ''}`}
                            onClick={() => setShowSuperChat(!showSuperChat)}
                            title="Super Chat"
                        >
                            <Sparkles size={16} />
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => { setInputFocused(false); setNewComment(''); }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={!newComment.trim()}>
                            Comment
                        </button>
                    </div>
                )}
                {showSuperChat && (
                    <div className="super-chat-panel">
                        <span>💰 Super Chat: $</span>
                        <input
                            type="number"
                            min="1"
                            max="500"
                            value={superChatAmount}
                            onChange={(e) => setSuperChatAmount(Number(e.target.value))}
                        />
                        <span className="super-chat-color" style={{
                            background: superChatAmount >= 100 ? '#ff0000' :
                                superChatAmount >= 50 ? '#ff6600' :
                                    superChatAmount >= 20 ? '#ffcc00' : '#00cc00'
                        }} />
                    </div>
                )}
            </div>
        </form>
    );
};

// ─── Sub-component: Comments List ───
const CommentsList = ({
    loading,
    comments,
    handleLike,
    handleDelete,
    setReplyTo,
    setReplyContent,
    replyTo,
    replyContent,
    handleReply,
    formatTimeAgo,
    user,
    isAuthenticated
}) => (
    <div className="comments-list">
        {loading ? (
            <div className="loading">Loading comments...</div>
        ) : comments.length === 0 ? (
            <div className="no-comments">No comments yet. Be the first!</div>
        ) : (
            comments.map(comment => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onReply={(id) => {
                        setReplyTo(id);
                        setReplyContent('');
                    }}
                    replyTo={replyTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleReply={handleReply}
                    formatTimeAgo={formatTimeAgo}
                    currentUserId={user?.id}
                    isAuthenticated={isAuthenticated}
                />
            ))
        )}
    </div>
);

const CommentSection = ({ videoId }) => {
    const { user, token, isAuthenticated } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [showSuperChat, setShowSuperChat] = useState(false);
    const [superChatAmount, setSuperChatAmount] = useState(5);
    const [total, setTotal] = useState(0);
    const [showMobileComments, setShowMobileComments] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);

    useEffect(() => {
        loadComments();
    }, [videoId]);

    // Prevent body scroll when mobile overlay is open
    useEffect(() => {
        if (showMobileComments) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showMobileComments]);

    const loadComments = async () => {
        try {
            const data = await api.getComments(videoId);
            setComments(data.comments || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !isAuthenticated) return;

        try {
            const superChat = showSuperChat ? { amount: superChatAmount } : null;
            const comment = await api.addComment(videoId, newComment, null, superChat, token);
            setComments([comment, ...comments]);
            setNewComment('');
            setShowSuperChat(false);
            setTotal(total + 1);
            setInputFocused(false);
        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    const handleReply = async (parentId) => {
        if (!replyContent.trim() || !isAuthenticated) return;

        try {
            const reply = await api.addComment(videoId, replyContent, parentId, null, token);
            setComments(comments.map(c => {
                if (c.id === parentId) {
                    return { ...c, replies: [...(c.replies || []), reply] };
                }
                return c;
            }));
            setReplyTo(null);
            setReplyContent('');
        } catch (err) {
            console.error('Failed to reply:', err);
        }
    };

    const handleLike = async (commentId) => {
        if (!isAuthenticated) return;

        try {
            await api.likeComment(commentId, token);
            setComments(comments.map(c => {
                if (c.id === commentId) {
                    return { ...c, likes_count: c.likes_count + 1 };
                }
                if (c.replies) {
                    return {
                        ...c,
                        replies: c.replies.map(r =>
                            r.id === commentId ? { ...r, likes_count: r.likes_count + 1 } : r
                        )
                    };
                }
                return c;
            }));
        } catch (err) {
            console.error('Failed to like comment:', err);
        }
    };

    const handleDelete = async (commentId) => {
        if (!isAuthenticated) return;

        try {
            await api.deleteComment(commentId, token);
            setComments(comments.filter(c => c.id !== commentId));
            setTotal(total - 1);
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const formatTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    // Get first comment for preview
    const firstComment = comments[0];

    const formProps = {
        isAuthenticated,
        user,
        newComment,
        setNewComment,
        handleSubmit,
        inputFocused,
        setInputFocused,
        showSuperChat,
        setShowSuperChat,
        superChatAmount,
        setSuperChatAmount
    };

    const listProps = {
        loading,
        comments,
        handleLike,
        handleDelete,
        setReplyTo,
        setReplyContent,
        replyTo,
        replyContent,
        handleReply,
        formatTimeAgo,
        user,
        isAuthenticated
    };

    return (
        <>
            {/* ═══ Mobile: Compact Preview Bar (YouTube Pill Style) ═══ */}
            <div className="lg:hidden">
                <div
                    className="comment-preview-bar"
                    onClick={() => setShowMobileComments(true)}
                >
                    <div className="flex flex-col gap-1 w-full overflow-hidden">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">Comments</h3>
                            <span className="text-[13px] text-gray-400">{total}</span>
                        </div>

                        {firstComment && (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-blue-500 overflow-hidden flex-shrink-0">
                                    {firstComment.user?.avatar_url ? (
                                        <img src={firstComment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-purple-600 text-[10px] text-white font-bold">
                                            {(firstComment.user?.display_name || firstComment.user?.username || "U")[0]}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[13px] text-gray-200 truncate pr-4">
                                    {firstComment.content}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1 text-gray-400">
                        <ArrowUpDown size={16} />
                    </div>
                </div>

                {/* Mobile Bottom Sheet Overlay */}
                {showMobileComments && (
                    <div
                        className="comment-overlay-backdrop"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowMobileComments(false); }}
                    >
                        <div className="comment-overlay-sheet">
                            <div className="comment-overlay-header">
                                <h3>Comments</h3>
                                <button onClick={() => setShowMobileComments(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="comment-overlay-body">
                                <CommentForm {...formProps} />
                                <CommentsList {...listProps} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ Desktop: Inline Comments ═══ */}
            <div className="hidden lg:block comment-section-desktop">
                <div className="comment-count-header">
                    <h3>{total} Comments</h3>
                    <button className="sort-btn">
                        <ArrowUpDown size={16} />
                        Sort by
                    </button>
                </div>
                <CommentForm {...formProps} />
                <CommentsList {...listProps} />
            </div>
        </>
    );
};

const CommentItem = ({
    comment,
    onLike,
    onDelete,
    onReply,
    replyTo,
    replyContent,
    setReplyContent,
    handleReply,
    formatTimeAgo,
    currentUserId,
    isAuthenticated,
    isReply = false
}) => {
    const [showReplies, setShowReplies] = useState(false);

    return (
        <div
            className={`comment-item ${isReply ? 'is-reply' : ''} ${comment.is_super_chat ? 'super-chat' : ''}`}
            style={comment.is_super_chat ? { borderColor: comment.super_chat_color } : {}}
        >
            {comment.is_super_chat && (
                <div className="super-chat-badge" style={{ background: comment.super_chat_color }}>
                    💰 ${comment.super_chat_amount}
                </div>
            )}

            <div className="comment-avatar">
                {comment.user?.avatar_url ? (
                    <img src={comment.user.avatar_url} alt={comment.user.display_name} />
                ) : (
                    <User size={isReply ? 14 : 18} />
                )}
            </div>

            <div className="comment-body">
                <div className="comment-meta">
                    <span className="comment-author">
                        @{comment.user?.display_name || comment.user?.username || 'User'}
                    </span>
                    <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
                    {comment.is_edited && <span className="edited-tag">(edited)</span>}
                </div>

                <p className="comment-text">{comment.content}</p>

                <div className="comment-actions">
                    <button onClick={() => onLike(comment.id)} disabled={!isAuthenticated}>
                        <Heart size={14} /> {comment.likes_count || ''}
                    </button>
                    {!isReply && (
                        <button onClick={() => onReply(comment.id)} disabled={!isAuthenticated}>
                            <Reply size={14} /> Reply
                        </button>
                    )}
                    {currentUserId === comment.user_id && (
                        <button className="delete-btn" onClick={() => onDelete(comment.id)}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {/* Reply Input */}
                {replyTo === comment.id && (
                    <div className="reply-input">
                        <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            autoFocus
                        />
                        <button className="cancel-btn" onClick={() => onReply(null)}>Cancel</button>
                        <button onClick={() => handleReply(comment.id)}>Reply</button>
                    </div>
                )}

                {/* Replies */}
                {!isReply && comment.replies && comment.replies.length > 0 && (
                    <div className="replies-section">
                        <button
                            className="show-replies"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            <ChevronDown className={showReplies ? 'rotated' : ''} size={16} />
                            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </button>
                        {showReplies && (
                            <div className="replies-list">
                                {comment.replies.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        onLike={onLike}
                                        onDelete={onDelete}
                                        onReply={onReply}
                                        replyTo={replyTo}
                                        replyContent={replyContent}
                                        setReplyContent={setReplyContent}
                                        handleReply={handleReply}
                                        formatTimeAgo={formatTimeAgo}
                                        currentUserId={currentUserId}
                                        isAuthenticated={isAuthenticated}
                                        isReply={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
