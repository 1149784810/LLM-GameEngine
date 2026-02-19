/**
 * Clicker Quest - 事件总线
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 提供全局事件订阅/发布机制，实现模块间解耦通信
 */

class EventBus {
    constructor() {
        // 事件监听器映射表
        this.listeners = new Map();
        
        // 事件历史记录（用于调试）
        this.eventHistory = [];
        this.maxHistoryLength = 100;
        
        // 是否启用调试模式
        this.debugMode = false;
    }

    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} context - 回调上下文（可选）
     * @returns {Function} 取消订阅函数
     */
    on(eventName, callback, context = null) {
        // 检查参数有效性
        if (typeof eventName !== 'string' || typeof callback !== 'function') {
            console.error('EventBus: 无效的参数');
            return () => {};
        }

        // 创建监听器对象
        const listener = {
            callback: callback,
            context: context,
            once: false
        };

        // 添加到监听器映射表
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(listener);

        // 返回取消订阅函数
        return () => this.off(eventName, callback);
    }

    /**
     * 订阅一次性事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} context - 回调上下文（可选）
     * @returns {Function} 取消订阅函数
     */
    once(eventName, callback, context = null) {
        // 检查参数有效性
        if (typeof eventName !== 'string' || typeof callback !== 'function') {
            console.error('EventBus: 无效的参数');
            return () => {};
        }

        // 创建监听器对象
        const listener = {
            callback: callback,
            context: context,
            once: true
        };

        // 添加到监听器映射表
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(listener);

        // 返回取消订阅函数
        return () => this.off(eventName, callback);
    }

    /**
     * 取消订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            return;
        }

        const listeners = this.listeners.get(eventName);
        const index = listeners.findIndex(l => l.callback === callback);
        
        if (index !== -1) {
            listeners.splice(index, 1);
        }

        // 如果没有监听器了，删除事件
        if (listeners.length === 0) {
            this.listeners.delete(eventName);
        }
    }

    /**
     * 发布事件
     * @param {string} eventName - 事件名称
     * @param {*} data - 事件数据
     */
    emit(eventName, data = null) {
        // 记录事件历史
        this._recordEvent(eventName, data);

        // 获取所有监听器
        if (!this.listeners.has(eventName)) {
            return;
        }

        const listeners = this.listeners.get(eventName).slice(); // 复制数组，避免迭代时修改
        
        // 用于收集一次性监听器的索引
        const onceIndices = [];

        // 按顺序执行回调
        listeners.forEach((listener, index) => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, data);
                } else {
                    listener.callback(data);
                }

                // 标记一次性监听器
                if (listener.once) {
                    onceIndices.push(index);
                }
            } catch (error) {
                console.error(`EventBus: 事件处理器执行错误 [${eventName}]`, error);
            }
        });

        // 移除一次性监听器（从后往前移除，避免索引问题）
        const originalListeners = this.listeners.get(eventName);
        for (let i = onceIndices.length - 1; i >= 0; i--) {
            const originalIndex = originalListeners.findIndex(
                l => l.callback === listeners[onceIndices[i]].callback
            );
            if (originalIndex !== -1) {
                originalListeners.splice(originalIndex, 1);
            }
        }

        // 如果没有监听器了，删除事件
        if (originalListeners.length === 0) {
            this.listeners.delete(eventName);
        }
    }

    /**
     * 记录事件历史
     * @private
     * @param {string} eventName - 事件名称
     * @param {*} data - 事件数据
     */
    _recordEvent(eventName, data) {
        if (this.eventHistory.length >= this.maxHistoryLength) {
            this.eventHistory.shift();
        }

        this.eventHistory.push({
            name: eventName,
            data: data,
            timestamp: Date.now()
        });

        // 调试模式下输出日志
        if (this.debugMode) {
            console.log(`[EventBus] ${eventName}`, data);
        }
    }

    /**
     * 清除指定事件的所有监听器
     * @param {string} eventName - 事件名称
     */
    clear(eventName) {
        if (eventName) {
            this.listeners.delete(eventName);
        }
    }

    /**
     * 清除所有事件监听器
     */
    clearAll() {
        this.listeners.clear();
        this.eventHistory = [];
    }

    /**
     * 获取事件监听器数量
     * @param {string} eventName - 事件名称
     * @returns {number} 监听器数量
     */
    listenerCount(eventName) {
        if (!this.listeners.has(eventName)) {
            return 0;
        }
        return this.listeners.get(eventName).length;
    }

    /**
     * 获取所有事件名称
     * @returns {string[]} 事件名称数组
     */
    eventNames() {
        return Array.from(this.listeners.keys());
    }

    /**
     * 检查是否有指定事件的监听器
     * @param {string} eventName - 事件名称
     * @returns {boolean} 是否有监听器
     */
    hasListeners(eventName) {
        return this.listeners.has(eventName) && this.listeners.get(eventName).length > 0;
    }

    /**
     * 获取事件历史记录
     * @param {string} eventName - 事件名称（可选，不传则返回所有）
     * @returns {Array} 事件历史记录
     */
    getHistory(eventName = null) {
        if (eventName) {
            return this.eventHistory.filter(e => e.name === eventName);
        }
        return [...this.eventHistory];
    }

    /**
     * 启用调试模式
     * @param {boolean} enabled - 是否启用
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * 获取事件总线状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            eventCount: this.listeners.size,
            totalListeners: Array.from(this.listeners.values())
                .reduce((sum, arr) => sum + arr.length, 0),
            historyLength: this.eventHistory.length,
            debugMode: this.debugMode
        };
    }
}

// 定义全局事件类型常量
const GameEvents = {
    // 金币相关事件
    GOLD_CHANGED: 'gold:changed',
    GOLD_EARNED: 'gold:earned',
    GOLD_SPENT: 'gold:spent',
    
    // 点击相关事件
    CLICK_PERFORMED: 'click:performed',
    CRITICAL_HIT: 'click:critical',
    
    // DPS相关事件
    DPS_CHANGED: 'dps:changed',
    
    // 道具相关事件
    ITEM_PURCHASED: 'item:purchased',
    ITEM_USED: 'item:used',
    ITEM_EXPIRED: 'item:expired',
    BUFF_ACTIVATED: 'buff:activated',
    BUFF_DEACTIVATED: 'buff:deactivated',
    
    // 商店相关事件
    SHOP_OPENED: 'shop:opened',
    SHOP_CLOSED: 'shop:closed',
    SHOP_REFRESHED: 'shop:refreshed',
    
    // 成就相关事件
    ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
    ACHIEVEMENT_PROGRESS: 'achievement:progress',
    
    // 存档相关事件
    SAVE_COMPLETED: 'save:completed',
    SAVE_FAILED: 'save:failed',
    LOAD_COMPLETED: 'load:completed',
    LOAD_FAILED: 'load:failed',
    
    // 游戏状态事件
    GAME_INITIALIZED: 'game:initialized',
    GAME_STARTED: 'game:started',
    GAME_PAUSED: 'game:paused',
    GAME_RESUMED: 'game:resumed',
    
    // UI相关事件
    SCREEN_CHANGED: 'ui:screenChanged',
    MODAL_OPENED: 'ui:modalOpened',
    MODAL_CLOSED: 'ui:modalClosed',
    
    // 离线收益事件
    OFFLINE_REWARD_CALCULATED: 'offline:calculated',
    OFFLINE_REWARD_CLAIMED: 'offline:claimed'
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, GameEvents };
} else {
    window.EventBus = EventBus;
    window.GameEvents = GameEvents;
}
