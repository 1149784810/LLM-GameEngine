/**
 * BuffManager - BUFF管理系统
 * 负责BUFF添加、移除、倒计时、效果计算
 * 
 * @module BuffManager
 * @author LP -> SP-1
 * @version 1.1.0
 */

class BuffManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // BUFF状态
        this.buffState = {
            activeBuffs: [],
            buffEffects: {
                goldMultiplier: 1,      // 金币倍率
                gpsMultiplier: 1,       // GPS倍率
                critRateBonus: 0,       // 暴击率加成
                critDamageBonus: 0,     // 暴击伤害加成
                clickMultiplier: 1      // 点击倍率
            }
        };
        
        // 更新定时器
        this.updateInterval = null;
        
        // 事件监听器
        this.listeners = new Map();
    }

    /**
     * 初始化BUFF系统
     */
    init() {
        // 恢复存档中的BUFF
        this.restoreBuffs();
        
        // 启动BUFF更新
        this.startBuffUpdate();
        
        console.log('BuffManager initialized');
    }

    /**
     * 恢复存档中的BUFF
     */
    restoreBuffs() {
        if (this.gameState.playerData.activeBuffs && this.gameState.playerData.activeBuffs.length > 0) {
            // 过滤掉已过期的BUFF
            const now = Date.now();
            this.buffState.activeBuffs = this.gameState.playerData.activeBuffs.filter(buff => {
                const elapsed = (now - buff.startTime) / 1000;
                return elapsed < buff.remainingTime;
            });
            
            // 更新剩余时间
            this.buffState.activeBuffs.forEach(buff => {
                const elapsed = (now - buff.startTime) / 1000;
                buff.remainingTime = Math.max(0, buff.remainingTime - elapsed);
            });
            
            // 重新计算效果
            this.recalculateBuffEffects();
        }
    }

    /**
     * 启动BUFF更新定时器
     */
    startBuffUpdate() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.updateBuffs(1);
        }, 1000);
    }

    /**
     * 停止BUFF更新定时器
     */
    stopBuffUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * 添加BUFF
     * @param {string} itemId - 道具ID
     * @param {Object} item - 道具配置
     */
    addBuff(itemId, item) {
        const effect = item.effect;
        
        // 查找是否已存在同类BUFF
        const existingBuff = this.buffState.activeBuffs.find(
            buff => buff.effect.type === effect.type
        );
        
        if (existingBuff) {
            // 同类效果时间叠加
            existingBuff.remainingTime += item.duration;
            existingBuff.stacks = (existingBuff.stacks || 1) + 1;
            
            console.log(`[BuffManager] Extended buff: ${itemId}, new time: ${existingBuff.remainingTime}s`);
            
            this.emit('buffExtended', { 
                buffId: existingBuff.id, 
                itemId,
                newTime: existingBuff.remainingTime 
            });
        } else {
            // 创建新BUFF
            const buff = {
                id: `buff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                itemId,
                name: item.name,
                icon: item.icon,
                effect: { ...effect },
                remainingTime: item.duration,
                maxTime: item.duration,
                startTime: Date.now(),
                stacks: 1
            };
            
            this.buffState.activeBuffs.push(buff);
            
            console.log(`[BuffManager] Added buff: ${itemId}, duration: ${item.duration}s`);
            
            this.emit('buffAdded', { buff, itemId });
        }
        
        // 同步到玩家数据
        this.syncToPlayerData();
        
        // 重新计算效果
        this.recalculateBuffEffects();
    }

    /**
     * 移除BUFF
     * @param {string} buffId - BUFF ID
     */
    removeBuff(buffId) {
        const index = this.buffState.activeBuffs.findIndex(buff => buff.id === buffId);
        if (index === -1) return;
        
        const removedBuff = this.buffState.activeBuffs[index];
        this.buffState.activeBuffs.splice(index, 1);
        
        console.log(`[BuffManager] Removed buff: ${removedBuff.name}`);
        
        // 同步到玩家数据
        this.syncToPlayerData();
        
        // 重新计算效果
        this.recalculateBuffEffects();
        
        this.emit('buffRemoved', { buff: removedBuff });
    }

    /**
     * 更新所有BUFF
     * @param {number} deltaTime - 时间增量（秒）
     */
    updateBuffs(deltaTime) {
        const expiredBuffs = [];
        
        this.buffState.activeBuffs.forEach(buff => {
            buff.remainingTime -= deltaTime;
            
            // 时间警告（剩余10秒以下）
            if (buff.remainingTime <= 10 && buff.remainingTime > 10 - deltaTime) {
                this.emit('buffWarning', { buff });
            }
            
            // 检查过期
            if (buff.remainingTime <= 0) {
                expiredBuffs.push(buff.id);
            }
        });
        
        // 移除过期的BUFF
        if (expiredBuffs.length > 0) {
            expiredBuffs.forEach(buffId => this.removeBuff(buffId));
        }
    }

    /**
     * 重新计算所有BUFF效果
     */
    recalculateBuffEffects() {
        // 重置效果
        this.buffState.buffEffects = {
            goldMultiplier: 1,
            gpsMultiplier: 1,
            critRateBonus: 0,
            critDamageBonus: 0,
            clickMultiplier: 1
        };
        
        // 累加所有BUFF效果
        this.buffState.activeBuffs.forEach(buff => {
            switch (buff.effect.type) {
                case 'gold_multiplier':
                    // 金币倍率相乘
                    this.buffState.buffEffects.goldMultiplier *= buff.effect.value;
                    break;
                    
                case 'gps_multiplier':
                    // GPS倍率相乘
                    this.buffState.buffEffects.gpsMultiplier *= buff.effect.value;
                    break;
                    
                case 'crit_rate_add':
                    // 暴击率加成相加
                    this.buffState.buffEffects.critRateBonus += buff.effect.value;
                    break;
                    
                case 'crit_damage_add':
                    // 暴击伤害加成相加
                    this.buffState.buffEffects.critDamageBonus += buff.effect.value;
                    break;
                    
                case 'click_multiplier':
                    // 点击倍率相乘
                    this.buffState.buffEffects.clickMultiplier *= buff.effect.value;
                    break;
            }
        });
        
        // 触发效果更新事件
        this.emit('effectsUpdated', { effects: this.buffState.buffEffects });
    }

    /**
     * 同步BUFF数据到玩家数据
     */
    syncToPlayerData() {
        this.gameState.playerData.activeBuffs = [...this.buffState.activeBuffs];
    }

    /**
     * 获取所有激活的BUFF
     * @returns {Array} BUFF列表
     */
    getActiveBuffs() {
        return this.buffState.activeBuffs.map(buff => ({
            ...buff,
            progress: buff.remainingTime / buff.maxTime,
            isWarning: buff.remainingTime <= 10
        }));
    }

    /**
     * 获取BUFF数量
     * @returns {number} BUFF数量
     */
    getBuffCount() {
        return this.buffState.activeBuffs.length;
    }

    /**
     * 获取所有BUFF效果
     * @returns {Object} BUFF效果
     */
    getTotalBuffs() {
        return { ...this.buffState.buffEffects };
    }

    /**
     * 获取金币倍率
     * @returns {number} 金币倍率
     */
    getGoldMultiplier() {
        return this.buffState.buffEffects.goldMultiplier;
    }

    /**
     * 获取GPS倍率
     * @returns {number} GPS倍率
     */
    getGPSMultiplier() {
        return this.buffState.buffEffects.gpsMultiplier;
    }

    /**
     * 获取暴击率加成
     * @returns {number} 暴击率加成
     */
    getCritRateBonus() {
        return this.buffState.buffEffects.critRateBonus;
    }

    /**
     * 获取暴击伤害加成
     * @returns {number} 暴击伤害加成
     */
    getCritDamageBonus() {
        return this.buffState.buffEffects.critDamageBonus;
    }

    /**
     * 获取点击倍率
     * @returns {number} 点击倍率
     */
    getClickMultiplier() {
        return this.buffState.buffEffects.clickMultiplier;
    }

    /**
     * 检查是否有指定类型的BUFF
     * @param {string} effectType - 效果类型
     * @returns {boolean} 是否存在
     */
    hasBuffType(effectType) {
        return this.buffState.activeBuffs.some(buff => buff.effect.type === effectType);
    }

    /**
     * 获取指定类型BUFF的剩余时间
     * @param {string} effectType - 效果类型
     * @returns {number} 剩余时间（秒），不存在返回0
     */
    getBuffRemainingTime(effectType) {
        const buff = this.buffState.activeBuffs.find(b => b.effect.type === effectType);
        return buff ? buff.remainingTime : 0;
    }

    /**
     * 清除所有BUFF
     */
    clearAllBuffs() {
        this.buffState.activeBuffs = [];
        this.syncToPlayerData();
        this.recalculateBuffEffects();
        this.emit('allBuffsCleared');
    }

    // ==================== 事件系统 ====================

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
                } catch (e) {
                    console.error(`[BuffManager] Event listener error:`, e);
                }
            });
        }
    }
}

window.BuffManager = BuffManager;
