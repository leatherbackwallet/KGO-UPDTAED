"use strict";
/**
 * Session Management Service
 * Handles user sessions, concurrent session limits, and session tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
class SessionService {
    constructor() {
        this.activeSessions = new Map();
        this.userSessions = new Map(); // userId -> Set of sessionIds
        this.MAX_SESSIONS_PER_USER = 5; // Maximum concurrent sessions per user
        this.SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
        this.INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
    }
    /**
     * Create a new session for a user
     */
    async createSession(userId, sessionId, tokenId, ipAddress, userAgent) {
        try {
            // Check if user already has maximum sessions
            const userSessionIds = this.userSessions.get(userId) || new Set();
            if (userSessionIds.size >= this.MAX_SESSIONS_PER_USER) {
                // Remove oldest sessions to make room
                const removedSessions = await this.removeOldestSessions(userId, 1);
                // Create new session
                const newSession = {
                    userId,
                    sessionId,
                    tokenId,
                    ipAddress,
                    userAgent,
                    createdAt: new Date(),
                    lastActivity: new Date(),
                    isActive: true
                };
                this.activeSessions.set(sessionId, newSession);
                userSessionIds.add(sessionId);
                this.userSessions.set(userId, userSessionIds);
                return {
                    success: true,
                    message: 'Session created (oldest session removed)',
                    removedSessions
                };
            }
            // Create new session
            const newSession = {
                userId,
                sessionId,
                tokenId,
                ipAddress,
                userAgent,
                createdAt: new Date(),
                lastActivity: new Date(),
                isActive: true
            };
            this.activeSessions.set(sessionId, newSession);
            userSessionIds.add(sessionId);
            this.userSessions.set(userId, userSessionIds);
            return {
                success: true,
                message: 'Session created successfully'
            };
        }
        catch (error) {
            console.error('Error creating session:', error);
            return {
                success: false,
                message: 'Failed to create session'
            };
        }
    }
    /**
     * Update session activity
     */
    updateSessionActivity(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isActive) {
            return false;
        }
        session.lastActivity = new Date();
        this.activeSessions.set(sessionId, session);
        return true;
    }
    /**
     * Validate session
     */
    validateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return { valid: false, reason: 'Session not found' };
        }
        if (!session.isActive) {
            return { valid: false, reason: 'Session inactive' };
        }
        const now = new Date();
        // Check session timeout
        if (now.getTime() - session.createdAt.getTime() > this.SESSION_TIMEOUT) {
            this.removeSession(sessionId);
            return { valid: false, reason: 'Session expired' };
        }
        // Check inactivity timeout
        if (now.getTime() - session.lastActivity.getTime() > this.INACTIVITY_TIMEOUT) {
            this.removeSession(sessionId);
            return { valid: false, reason: 'Session inactive' };
        }
        // Update last activity
        session.lastActivity = now;
        this.activeSessions.set(sessionId, session);
        return { valid: true, userId: session.userId };
    }
    /**
     * Remove a specific session
     */
    removeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return false;
        }
        // Remove from active sessions
        this.activeSessions.delete(sessionId);
        // Remove from user sessions
        const userSessionIds = this.userSessions.get(session.userId);
        if (userSessionIds) {
            userSessionIds.delete(sessionId);
            if (userSessionIds.size === 0) {
                this.userSessions.delete(session.userId);
            }
            else {
                this.userSessions.set(session.userId, userSessionIds);
            }
        }
        return true;
    }
    /**
     * Remove all sessions for a user
     */
    removeAllUserSessions(userId) {
        const userSessionIds = this.userSessions.get(userId);
        if (!userSessionIds) {
            return [];
        }
        const removedSessions = [];
        for (const sessionId of userSessionIds) {
            this.activeSessions.delete(sessionId);
            removedSessions.push(sessionId);
        }
        this.userSessions.delete(userId);
        return removedSessions;
    }
    /**
     * Remove oldest sessions for a user
     */
    async removeOldestSessions(userId, count) {
        const userSessionIds = this.userSessions.get(userId);
        if (!userSessionIds) {
            return [];
        }
        // Get sessions sorted by creation time
        const sessions = Array.from(userSessionIds)
            .map(sessionId => ({
            sessionId,
            session: this.activeSessions.get(sessionId)
        }))
            .filter(item => item.session)
            .sort((a, b) => a.session.createdAt.getTime() - b.session.createdAt.getTime());
        const removedSessions = [];
        for (let i = 0; i < Math.min(count, sessions.length); i++) {
            const sessionId = sessions[i].sessionId;
            this.removeSession(sessionId);
            removedSessions.push(sessionId);
        }
        return removedSessions;
    }
    /**
     * Get active sessions for a user
     */
    getUserSessions(userId) {
        const userSessionIds = this.userSessions.get(userId);
        if (!userSessionIds) {
            return [];
        }
        return Array.from(userSessionIds)
            .map(sessionId => this.activeSessions.get(sessionId))
            .filter(session => session && session.isActive);
    }
    /**
     * Get session statistics
     */
    getSessionStats() {
        const totalSessions = this.activeSessions.size;
        const activeSessions = Array.from(this.activeSessions.values())
            .filter(session => session.isActive).length;
        const usersWithMultipleSessions = Array.from(this.userSessions.values())
            .filter(sessionIds => sessionIds.size > 1).length;
        const averageSessionsPerUser = this.userSessions.size > 0
            ? totalSessions / this.userSessions.size
            : 0;
        return {
            totalSessions,
            activeSessions,
            usersWithMultipleSessions,
            averageSessionsPerUser
        };
    }
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = new Date();
        const expiredSessions = [];
        for (const [sessionId, session] of this.activeSessions.entries()) {
            const sessionAge = now.getTime() - session.createdAt.getTime();
            const inactivityTime = now.getTime() - session.lastActivity.getTime();
            if (sessionAge > this.SESSION_TIMEOUT || inactivityTime > this.INACTIVITY_TIMEOUT) {
                expiredSessions.push(sessionId);
            }
        }
        expiredSessions.forEach(sessionId => this.removeSession(sessionId));
        if (expiredSessions.length > 0) {
            console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
        }
    }
    /**
     * Force logout user from all devices
     */
    async forceLogoutUser(userId) {
        try {
            const removedSessions = this.removeAllUserSessions(userId);
            // In a real implementation, you would also invalidate JWT tokens
            // This could be done by maintaining a blacklist of tokens
            return {
                success: true,
                removedSessions: removedSessions.length
            };
        }
        catch (error) {
            console.error('Error force logging out user:', error);
            return {
                success: false,
                removedSessions: 0
            };
        }
    }
}
// Create singleton instance
const sessionService = new SessionService();
// Clean up expired sessions every 5 minutes
setInterval(() => {
    sessionService.cleanupExpiredSessions();
}, 5 * 60 * 1000);
exports.default = sessionService;
