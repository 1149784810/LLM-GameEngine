/**
 * Clicker Quest - 离线收益系统
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 计算离线期间的金币收益，提供离线奖励领取功能
 */

class OfflineRewardSystem {
    constructor(eventBus, goldManager, dpsManager, gameData) {
        this.eventBus = eventBus;
        this.goldManager = goldManager;
        this.dpsManager = dpsManager;
        this.gameData = gameData;
        
        // 离线收益配置
        this.offlineRewardRatio = GameConfig.gold.offlineRewardRatio;  // 50%
        this.maxOfflineTime = GameConfig.gold.maxOfflineTime;          // 24小时（秒）
        
        // 离线收益状态
        this.pendingReward = 0;
        this.offlineTime = 0;
        this.lastCalculationTime = 0;
        
        // 初始化
        this._init();
    }

    /**
     * 初始化离线收益系统
     * @private
     */
    _init() {
        // 绑定事件监听
        this._bindEventListeners();
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEventListeners() {
        if (this.eventBus) {
            // 监听游戏初始化完成事件
            this.eventBus.on(GameEvents.GAME_INITIALIZED, (data) => {
                // 游戏初始化时计算离线收益
                if (data && data.lastSaveTime) {
                    this.calculateOfflineReward(data.lastSaveTime, Date.now());
                }
            });
        }
    }

    /**
     * 计算离线收益
     * @param {number} lastSaveTime - 上次保存时间戳（毫秒）
     * @param {number} currentTime - 当前时间戳（毫秒）
     * @returns {Object} 离线收益结果
     */
    calculateOfflineReward(lastSaveTime, currentTime) {
        // 计算离线时长（秒）
        let offlineSeconds = Math.floor((currentTime - lastSaveTime) / 1000);
        
        // 离线时间过短，不计算收益
        if (offlineSeconds < 60) { // 少于1分钟不计收益
            this.pendingReward = 0;
            this.offlineTime = 0;
            
            return {
                offlineTime: 0,
                offlineTimeFormatted: '0秒',
                offlineReward: 0,
                offlineRewardFormatted: '0',
                cappedTime: false,
                dps: 0,
                ratio: this.offlineRewardRatio
            };
        }
        
        // 应用时长上限
        const cappedTime = offlineSeconds > this.maxOfflineTime;
        offlineSeconds = Math.min(offlineSeconds, this.maxOfflineTime);
        
        // 获取当前DPS
        const currentDPS = this.dpsManager ? this.dpsManager.getCurrentDPS() : 0;
        
        // 计算收益: DPS × offlineTime × offlineRewardRatio
        // DPS是每秒金币数，offlineSeconds是秒数
        const offlineReward = Math.floor(currentDPS * offlineSeconds * this.offlineRewardRatio);
        
        // 保存计算结果
        this.pendingReward = offlineReward;
        this.offlineTime = offlineSeconds;
        this.lastCalculationTime = currentTime;
        
        // 更新统计数据
        if (this.gameData && this.gameData.statistics) {
            this.gameData.statistics.longestOfflineTime = Math.max(
                this.gameData.statistics.longestOfflineTime || 0,
                offlineSeconds
            );
        }
        
        const result = {
            offlineTime: offlineSeconds,
            offlineTimeFormatted: this.formatOfflineTime(offlineSeconds),
            offlineReward: offlineReward,
            offlineRewardFormatted: this._formatGold(offlineReward),
            cappedTime: cappedTime,
            dps: currentDPS,
            ratio: this.offlineRewardRatio * 100 + '%'
        };
        
        // 触发离线收益计算事件
        if (this.eventBus) {
            this.eventBus.emit(GameEvents.OFFLINE_REWARD_CALCULATED, result);
        }
        
        return result;
    }

    /**
     * 领取离线收益
     * @param {number} reward - 收益金额（可选，默认使用计算的收益）
     * @returns {Object} 领取结果
     */
    claimOfflineReward(reward = null) {
        const amountToClaim = reward !== null ? reward : this.pendingReward;
        
        if (amountToClaim <= 0) {
            return {
                success: false,
                amount: 0,
                error: '没有可领取的离线收益'
            };
        }
        
        // 添加金币
        if (this.goldManager) {
            const actualAmount = this.goldManager.addGold(amountToClaim, GoldSource.OFFLINE_REWARD);
            
            // 更新统计数据
            if (this.gameData && this.gameData.statistics) {
                this.gameData.statistics.totalOfflineRewards = 
                    (this.gameData.statistics.totalOfflineRewards || 0) + actualAmount;
            }
            
            // 清空待领取收益
            this.pendingReward = 0;
            
            // 触发离线收益领取事件
            if (this.eventBus) {
                this.eventBus.emit(GameEvents.OFFLINE_REWARD_CLAIMED, {
                    amount: actualAmount,
                    offlineTime: this.offlineTime
                });
            }
            
            return {
                success: true,
                amount: actualAmount,
                formattedAmount: this._formatGold(actualAmount),
                offlineTime: this.offlineTime,
                error: null
            };
        }
        
        return {
            success: false,
            amount: 0,
            error: '金币管理器不可用'
        };
    }

    /**
     * 设置离线收益比例
     * @param {number} ratio - 收益比例（0-1之间）
     */
    setOfflineRewardRatio(ratio) {
        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;
        
        this.offlineRewardRatio = ratio;
    }

    /**
     * 设置最大离线时长
     * @param {number} maxTime - 最大时长（秒）
     */
    setMaxOfflineTime(maxTime) {
        if (maxTime < 0) maxTime = 0;
        this.maxOfflineTime = maxTime;
    }

    /**
     * 格式化离线时长
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时长
     */
    formatOfflineTime(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        const parts = [];
        
        if (hours > 0) {
            parts.push(`${hours}小时`);
        }
        
        if (minutes > 0) {
            parts.push(`${minutes}分钟`);
        }
        
        if (secs > 0 && hours === 0) {
            parts.push(`${secs}秒`);
        }
        
        return parts.join('');
    }

    /**
     * 格式化金币显示
     * @private
     * @param {number} amount - 金币数量
     * @returns {string} 格式化后的字符串
     */
    _formatGold(amount) {
        if (this.goldManager) {
            return this.goldManager.formatGold(amount);
        }
        
        // 降级格式化
        if (amount >= 1e12) {
            return (amount / 1e12).toFixed(2) + 'T';
        } else if (amount >= 1e9) {
            return (amount / 1e9).toFixed(2) + 'B';
        } else if (amount >= 1e6) {
            return (amount / 1e6).toFixed(2) + 'M';
        } else if (amount >= 1e3) {
            return (amount / 1e3).toFixed(2) + 'K';
        }
        
        return amount.toString();
    }

    /**
     * 获取待领取收益
     * @returns {number} 待领取收益
     */
    getPendingReward() {
        return this.pendingReward;
    }

    /**
     * 获取离线时长
     * @returns {number} 离线时长（秒）
     */
    getOfflineTime() {
        return this.offlineTime;
    }

    /**
     * 检查是否有待领取收益
     * @returns {boolean} 是否有待领取收益
     */
    hasPendingReward() {
        return this.pendingReward > 0;
    }

    /**
     * 获取离线收益预览
     * @param {number} duration - 预计离线时长（秒）
     * @returns {Object} 预览结果
     */
    previewOfflineReward(duration) {
        const cappedDuration = Math.min(duration, this.maxOfflineTime);
        const currentDPS = this.dpsManager ? this.dpsManager.getCurrentDPS() : 0;
        const estimatedReward = Math.floor(currentDPS * cappedDuration * this.offlineRewardRatio);
        
        return {
            duration: cappedDuration,
            durationFormatted: this.formatOfflineTime(cappedDuration),
            estimatedReward: estimatedReward,
            estimatedRewardFormatted: this._formatGold(estimatedReward),
            dps: currentDPS,
            ratio: this.offlineRewardRatio,
            isCapped: duration > this.maxOfflineTime
        };
    }

    /**
     * 获取存档数据
     * @returns {Object} 离线收益数据
     */
    getSaveData() {
        return {
            pendingReward: this.pendingReward,
            offlineTime: this.offlineTime,
            lastCalculationTime: this.lastCalculationTime,
            offlineRewardRatio: this.offlineRewardRatio,
            maxOfflineTime: this.maxOfflineTime
        };
    }

    /**
     * 从存档数据恢复
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) return;
        
        this.pendingReward = data.pendingReward || 0;
        this.offlineTime = data.offlineTime || 0;
        this.lastCalculationTime = data.lastCalculationTime || 0;
        
        if (data.offlineRewardRatio !== undefined) {
            this.offlineRewardRatio = data.offlineRewardRatio;
        }
        
        if (data.maxOfflineTime !== undefined) {
            this.maxOfflineTime = data.maxOfflineTime;
        }
    }

    /**
     * 重置离线收益系统
     */
    reset() {
        this.pendingReward = 0;
        this.offlineTime = 0;
        this.lastCalculationTime = 0;
        this.offlineRewardRatio = GameConfig.gold.offlineRewardRatio;
        this.maxOfflineTime = GameConfig.gold.maxOfflineTime;
    }

    /**
     * 销毁离线收益系统
     */
    destroy() {
        // 清理事件监听
        if (this.eventBus) {
            this.eventBus.clear('game:initialized');
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineRewardSystem;
} else {
    window.OfflineRewardSystem = OfflineRewardSystem;
}
