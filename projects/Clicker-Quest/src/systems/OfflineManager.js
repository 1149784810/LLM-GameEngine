/**
 * OfflineManager - 离线收益管理系统
 * 负责离线时间计算、离线收益计算、效率加成
 * 
 * @module OfflineManager
 * @author LP -> CP-2
 * @version 1.1.0
 */

class OfflineManager {
    constructor(gameState, gpsManager) {
        this.gameState = gameState;
        this.gpsManager = gpsManager;
        
        // 离线配置
        this.config = {
            minOfflineSeconds: 60,       // 最小计算时间（秒）
            maxOfflineSeconds: 86400,    // 最大计算时间（秒）- 24小时
            baseEfficiency: 0.5,         // 基础效率（50%）
            timeWarpBonus: 0.10          // 时间扭曲每级加成（10%）
        };
        
        // 离线状态
        this.offlineState = {
            lastExitTime: 0,
            pendingReward: 0,
            offlineSeconds: 0,
            efficiency: 0,
            hasPendingReward: false
        };
        
        // 事件监听器
        this.listeners = new Map();
        
        // 统计数据
        this.statistics = {
            totalClaims: 0,
            totalGoldClaimed: 0,
            longestOffline: 0
        };
    }

    /**
     * 初始化离线系统
     * @param {Object} config - 配置参数
     */
    init(config) {
        this.config = { ...this.config, ...config };
        console.log('[OfflineManager] 初始化完成');
    }

    /**
     * 记录退出时间
     */
    recordExitTime() {
        this.gameState.playerData.exitTime = Date.now();
        console.log(`[OfflineManager] 退出时间已记录: ${new Date(this.gameState.playerData.exitTime).toLocaleString()}`);
    }

    /**
     * 计算离线收益
     * @returns {Object} 离线收益信息
     */
    calculateOfflineReward() {
        const currentTime = Date.now();
        const exitTime = this.gameState.playerData.exitTime || currentTime;
        
        // 计算离线时间（秒）
        const offlineMs = currentTime - exitTime;
        const offlineSeconds = Math.floor(offlineMs / 1000);
        
        // 更新状态
        this.offlineState.lastExitTime = exitTime;
        this.offlineState.offlineSeconds = offlineSeconds;
        
        // 检查最小离线时间
        if (offlineSeconds < this.config.minOfflineSeconds) {
            console.log(`[OfflineManager] 离线时间不足: ${offlineSeconds}秒 < ${this.config.minOfflineSeconds}秒`);
            return this.createEmptyResult(offlineSeconds, 'below_minimum');
        }
        
        // 限制最大计算时间
        const effectiveSeconds = Math.min(offlineSeconds, this.config.maxOfflineSeconds);
        
        // 计算离线效率
        const timeWarpLevel = this.gameState.getUpgradeLevel('time_warp');
        const efficiency = this.calculateEfficiency(timeWarpLevel);
        
        // 获取GPS（使用lastGPS或当前GPS）
        const gps = this.gameState.playerData.lastGPS || this.gameState.playerData.currentGPS || 0;
        
        // 如果GPS为0，没有离线收益
        if (gps <= 0) {
            console.log('[OfflineManager] GPS为0，无离线收益');
            return this.createEmptyResult(offlineSeconds, 'no_gps');
        }
        
        // 计算离线收益
        const reward = this.calculateReward(gps, efficiency, effectiveSeconds);
        
        // 更新状态
        this.offlineState.pendingReward = reward;
        this.offlineState.efficiency = efficiency;
        this.offlineState.hasPendingReward = true;
        
        // 更新最长离线时间记录
        if (offlineSeconds > this.statistics.longestOffline) {
            this.statistics.longestOffline = offlineSeconds;
        }
        
        const result = {
            hasReward: true,
            offlineSeconds,
            effectiveSeconds,
            reward,
            efficiency,
            efficiencyPercent: Math.round(efficiency * 100),
            gps,
            timeWarpLevel,
            isCapped: offlineSeconds > this.config.maxOfflineSeconds
        };
        
        console.log(`[OfflineManager] 离线收益计算完成: ${this.formatNumber(reward)}金币, 离线${this.formatOfflineTime(offlineSeconds)}`);
        
        // 触发事件
        this.emit('offlineCalculated', result);
        
        return result;
    }

    /**
     * 计算离线效率
     * @param {number} timeWarpLevel - 时间扭曲等级
     * @returns {number} 效率值（0-1）
     */
    calculateEfficiency(timeWarpLevel) {
        // 基础效率 + 时间扭曲加成
        let efficiency = this.config.baseEfficiency + (timeWarpLevel * this.config.timeWarpBonus);
        
        // 限制最大效率为100%
        efficiency = Math.min(efficiency, 1.0);
        
        return efficiency;
    }

    /**
     * 计算离线收益
     * @param {number} gps - 每秒金币产出
     * @param {number} efficiency - 效率
     * @param {number} seconds - 有效秒数
     * @returns {number} 收益金币数
     */
    calculateReward(gps, efficiency, seconds) {
        // 收益 = GPS × 效率 × 时间
        const reward = Math.floor(gps * efficiency * seconds);
        return Math.max(0, reward);
    }

    /**
     * 创建空结果
     * @param {number} offlineSeconds - 离线秒数
     * @param {string} reason - 原因
     * @returns {Object} 空结果对象
     */
    createEmptyResult(offlineSeconds, reason) {
        return {
            hasReward: false,
            offlineSeconds,
            effectiveSeconds: 0,
            reward: 0,
            efficiency: 0,
            efficiencyPercent: 0,
            gps: 0,
            reason
        };
    }

    /**
     * 领取离线收益
     * @returns {Object} 领取结果
     */
    claimOfflineReward() {
        const reward = this.offlineState.pendingReward;
        
        if (reward <= 0) {
            return { success: false, reason: 'no_reward' };
        }
        
        // 添加金币
        const addResult = this.gameState.addGold(reward, 'offline');
        
        if (!addResult.success) {
            return { success: false, reason: 'add_failed' };
        }
        
        // 更新统计
        this.gameState.playerData.totalOfflineGold += reward;
        this.statistics.totalClaims++;
        this.statistics.totalGoldClaimed += reward;
        
        // 重置待领取状态
        this.offlineState.pendingReward = 0;
        this.offlineState.hasPendingReward = false;
        
        console.log(`[OfflineManager] 离线收益已领取: ${this.formatNumber(reward)}金币`);
        
        // 触发事件
        this.emit('offlineClaimed', { 
            reward, 
            totalClaims: this.statistics.totalClaims,
            totalGoldClaimed: this.statistics.totalGoldClaimed
        });
        
        return { 
            success: true, 
            reward,
            totalClaims: this.statistics.totalClaims 
        };
    }

    /**
     * 检查是否有待领取的离线收益
     * @returns {boolean} 是否有待领取收益
     */
    hasPendingReward() {
        return this.offlineState.hasPendingReward && this.offlineState.pendingReward > 0;
    }

    /**
     * 获取待领取收益信息
     * @returns {Object} 待领取收益信息
     */
    getPendingRewardInfo() {
        return {
            hasReward: this.offlineState.hasPendingReward,
            reward: this.offlineState.pendingReward,
            offlineSeconds: this.offlineState.offlineSeconds,
            efficiency: this.offlineState.efficiency
        };
    }

    /**
     * 格式化离线时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     */
    formatOfflineTime(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            if (minutes > 0) {
                return `${hours}小时${minutes}分钟`;
            }
            return `${hours}小时`;
        }
        
        if (secs > 0) {
            return `${minutes}分钟${secs}秒`;
        }
        return `${minutes}分钟`;
    }

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toLocaleString();
    }

    /**
     * 获取离线收益预览（不实际领取）
     * @returns {Object} 预览信息
     */
    getOfflinePreview() {
        const currentTime = Date.now();
        const exitTime = this.gameState.playerData.exitTime || currentTime;
        const offlineSeconds = Math.floor((currentTime - exitTime) / 1000);
        
        if (offlineSeconds < this.config.minOfflineSeconds) {
            return {
                available: false,
                reason: 'below_minimum',
                minSeconds: this.config.minOfflineSeconds
            };
        }
        
        const effectiveSeconds = Math.min(offlineSeconds, this.config.maxOfflineSeconds);
        const timeWarpLevel = this.gameState.getUpgradeLevel('time_warp');
        const efficiency = this.calculateEfficiency(timeWarpLevel);
        const gps = this.gameState.playerData.lastGPS || this.gameState.playerData.currentGPS || 0;
        const estimatedReward = this.calculateReward(gps, efficiency, effectiveSeconds);
        
        return {
            available: gps > 0,
            offlineSeconds,
            effectiveSeconds,
            efficiency,
            efficiencyPercent: Math.round(efficiency * 100),
            gps,
            estimatedReward,
            timeWarpLevel,
            formattedTime: this.formatOfflineTime(offlineSeconds),
            formattedReward: this.formatNumber(estimatedReward)
        };
    }

    /**
     * 获取时间扭曲升级效果预览
     * @param {number} currentLevel - 当前等级
     * @returns {Object} 效果预览
     */
    getTimeWarpEffectPreview(currentLevel) {
        const currentEfficiency = this.calculateEfficiency(currentLevel);
        const nextEfficiency = this.calculateEfficiency(currentLevel + 1);
        
        return {
            currentLevel,
            currentEfficiency,
            currentEfficiencyPercent: Math.round(currentEfficiency * 100),
            nextEfficiency,
            nextEfficiencyPercent: Math.round(nextEfficiency * 100),
            improvement: nextEfficiency - currentEfficiency,
            improvementPercent: Math.round((nextEfficiency - currentEfficiency) * 100)
        };
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
                    console.error(`[OfflineManager] 事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            config: this.config,
            offlineState: {
                lastExitTime: this.offlineState.lastExitTime ? 
                    new Date(this.offlineState.lastExitTime).toLocaleString() : 'N/A',
                pendingReward: this.offlineState.pendingReward,
                offlineSeconds: this.offlineState.offlineSeconds,
                efficiency: this.offlineState.efficiency,
                hasPendingReward: this.offlineState.hasPendingReward
            },
            statistics: this.statistics,
            preview: this.getOfflinePreview()
        };
    }
}

// 导出模块
window.OfflineManager = OfflineManager;
