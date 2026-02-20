/**
 * EventEmitter - 事件发射器
 * 负责事件的发布订阅管理
 * 
 * @module EventEmitter
 * @author LP
 * @version 1.0.0
 */

class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(callback);
        
        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 订阅一次性事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback.apply(this, args);
        };
        
        this.on(event, wrapper);
    }

    /**
     * 取消订阅事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (!this.events.has(event)) return;
        
        if (callback) {
            this.events.get(event).delete(callback);
        } else {
            this.events.delete(event);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {...any} args - 参数
     */
    emit(event, ...args) {
        if (!this.events.has(event)) return;
        
        this.events.get(event).forEach(callback => {
            try {
                callback.apply(this, args);
            } catch (error) {
                console.error(`EventEmitter error in "${event}":`, error);
            }
        });
    }

    /**
     * 清除所有事件
     */
    clear() {
        this.events.clear();
    }

    /**
     * 获取事件监听器数量
     * @param {string} event - 事件名
     * @returns {number} 监听器数量
     */
    listenerCount(event) {
        if (!this.events.has(event)) return 0;
        return this.events.get(event).size;
    }
}

window.EventEmitter = EventEmitter;
