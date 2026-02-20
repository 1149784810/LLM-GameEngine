/**
 * LeaderboardManager - 排行榜管理系统
 * 负责排行榜数据管理、排名计算
 * 
 * @module LeaderboardManager
 * @author LP
 * @version 1.0.0
 */

class LeaderboardManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // 排行榜配置
        this.config = {
            maxEntries: 100,
            storageKey: 'clicker_quest_leaderboard'
        };
        
        // 排行榜数据
        this.leaderboardData = {
            daily: [],
            weekly: [],
            allTime: []
        };
        
        // 事件监听器
        this.listeners = new Map();
    }

    /**
     * 初始化排行榜系统
     */
    init() {
        this.loadLeaderboard();
        console.log('[LeaderboardManager] 初始化完成');
    }

    /**
     * 加载排行榜数据
     */
    loadLeaderboard() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.leaderboardData = {
                    daily: data.daily || [],
                    weekly: data.weekly || [],
                    allTime: data.allTime || []
                };
            }
        } catch (error) {
            console.error('[LeaderboardManager] 加载排行榜失败:', error);
        }
    }

    /**
     * 保存排行榜数据
     */
    saveLeaderboard() {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.leaderboardData));
        } catch (error) {
            console.error('[LeaderboardManager] 保存排行榜失败:', error);
        }
    }

    /**
     * 更新玩家分数
     * @param {string} category - 分类 (daily, weekly, allTime)
     * @param {Object} playerData - 玩家数据
     */
    updateScore(category, playerData) {
        const entry = {
            name: playerData.name || 'Player',
            score: playerData.score || this.gameState.getGold(),
            timestamp: Date.now()
        };
        
        const leaderboard = this.leaderboardData[category] || [];
        
        // 查找是否已存在
        const existingIndex = leaderboard.findIndex(e => e.name === entry.name);
        
        if (existingIndex !== -1) {
            // 更新分数（只保留最高分）
            if (entry.score > leaderboard[existingIndex].score) {
                leaderboard[existingIndex] = entry;
            }
        } else {
            leaderboard.push(entry);
        }
        
        // 排序并截取
        leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboardData[category] = leaderboard.slice(0, this.config.maxEntries);
        
        this.saveLeaderboard();
        this.emit('leaderboardUpdated', { category, leaderboard: this.leaderboardData[category] });
    }

    /**
     * 获取排行榜
     * @param {string} category - 分类 (daily, weekly, allTime)
     * @param {number} limit - 数量限制
     * @returns {Array} 排行榜数据
     */
    getLeaderboard(category = 'allTime', limit = 10) {
        const leaderboard = this.leaderboardData[category] || [];
        return leaderboard.slice(0, limit);
    }

    /**
     * 获取玩家排名
     * @param {string} category - 分类
     * @param {string} playerName - 玩家名称
     * @returns {number} 排名（从1开始，未上榜返回-1）
     */
    getPlayerRank(category, playerName) {
        const leaderboard = this.leaderboardData[category] || [];
        const index = leaderboard.findIndex(e => e.name === playerName);
        return index !== -1 ? index + 1 : -1;
    }

    /**
     * 清理过期数据
     */
    cleanExpiredData() {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const oneWeekMs = 7 * oneDayMs;
        
        // 清理日榜
        this.leaderboardData.daily = this.leaderboardData.daily.filter(
            entry => now - entry.timestamp < oneDayMs
        );
        
        // 清理周榜
        this.leaderboardData.weekly = this.leaderboardData.weekly.filter(
            entry => now - entry.timestamp < oneWeekMs
        );
        
        this.saveLeaderboard();
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {Object} data - 数据
     */
    emit(event, data = {}) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[LeaderboardManager] 事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
}

// 导出模块
window.LeaderboardManager = LeaderboardManager;
