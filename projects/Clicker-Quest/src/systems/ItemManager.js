/**
 * ItemManager - 道具管理系统
 * 负责道具库存管理、道具使用处理、道具购买
 * 
 * @module ItemManager
 * @author LP -> SP-1
 * @version 1.1.0
 */

class ItemManager {
    constructor(gameState, buffManager) {
        this.gameState = gameState;
        this.buffManager = buffManager;
        
        // 道具配置
        this.itemsConfig = {};
        
        // 事件监听器
        this.listeners = new Map();
    }

    /**
     * 初始化道具系统
     * @param {Object} config - 道具配置
     */
    init(config) {
        this.itemsConfig = config || {};
        
        // 初始化库存
        for (const itemId in this.itemsConfig) {
            if (this.gameState.playerData.inventory[itemId] === undefined) {
                this.gameState.playerData.inventory[itemId] = 0;
            }
        }
        
        console.log('ItemManager initialized with', Object.keys(this.itemsConfig).length, 'items');
    }

    /**
     * 获取道具信息
     * @param {string} itemId - 道具ID
     * @returns {Object|null} 道具信息
     */
    getItem(itemId) {
        const baseItem = this.itemsConfig[itemId];
        if (!baseItem) return null;
        
        const count = this.getInventoryCount(itemId);
        const canUse = count > 0;
        const canBuy = this.canBuyItem(itemId);
        
        return {
            ...baseItem,
            count,
            canUse,
            canBuy,
            isAvailable: count > 0
        };
    }

    /**
     * 获取所有道具列表
     * @param {boolean} onlyOwned - 是否只显示拥有的道具
     * @returns {Array} 道具列表
     */
    getAllItems(onlyOwned = false) {
        const items = [];
        for (const itemId in this.itemsConfig) {
            const item = this.getItem(itemId);
            if (item) {
                if (!onlyOwned || item.count > 0) {
                    items.push(item);
                }
            }
        }
        
        // 按库存数量排序，有库存的在前
        items.sort((a, b) => {
            if (a.count > 0 && b.count === 0) return -1;
            if (a.count === 0 && b.count > 0) return 1;
            return a.name.localeCompare(b.name);
        });
        
        return items;
    }

    /**
     * 获取可购买的道具列表（商店道具）
     * @returns {Array} 可购买道具列表
     */
    getShopItems() {
        const items = [];
        for (const itemId in this.itemsConfig) {
            const item = this.itemsConfig[itemId];
            if (item.source === 'shop') {
                items.push({
                    ...item,
                    count: this.getInventoryCount(itemId),
                    canBuy: this.canBuyItem(itemId)
                });
            }
        }
        
        // 按价格排序
        items.sort((a, b) => (a.price || 0) - (b.price || 0));
        
        return items;
    }

    /**
     * 获取道具库存数量
     * @param {string} itemId - 道具ID
     * @returns {number} 库存数量
     */
    getInventoryCount(itemId) {
        return this.gameState.playerData.inventory[itemId] || 0;
    }

    /**
     * 添加道具到库存
     * @param {string} itemId - 道具ID
     * @param {number} count - 数量
     * @param {string} source - 来源
     * @returns {boolean} 是否成功添加
     */
    addItem(itemId, count = 1, source = 'unknown') {
        const item = this.itemsConfig[itemId];
        if (!item) {
            console.warn(`[ItemManager] Item not found: ${itemId}`);
            return false;
        }
        
        const currentCount = this.getInventoryCount(itemId);
        const maxStack = item.maxStack || 99;
        const newCount = Math.min(currentCount + count, maxStack);
        
        this.gameState.playerData.inventory[itemId] = newCount;
        
        // 触发事件
        this.emit('itemAdded', { 
            itemId, 
            count: newCount - currentCount,
            total: newCount,
            source
        });
        
        console.log(`[ItemManager] Added ${count} ${itemId}, total: ${newCount}`);
        return true;
    }

    /**
     * 从库存移除道具
     * @param {string} itemId - 道具ID
     * @param {number} count - 数量
     * @returns {boolean} 是否成功移除
     */
    removeItem(itemId, count = 1) {
        const currentCount = this.getInventoryCount(itemId);
        if (currentCount < count) {
            console.warn(`[ItemManager] Not enough items: ${itemId} (${currentCount}/${count})`);
            return false;
        }
        
        this.gameState.playerData.inventory[itemId] = currentCount - count;
        
        // 触发事件
        this.emit('itemRemoved', { 
            itemId, 
            count,
            remaining: currentCount - count
        });
        
        return true;
    }

    /**
     * 使用道具
     * @param {string} itemId - 道具ID
     * @returns {Object} 使用结果 { success, message, data }
     */
    useItem(itemId) {
        const item = this.itemsConfig[itemId];
        if (!item) {
            return { success: false, message: '道具不存在', data: null };
        }
        
        const count = this.getInventoryCount(itemId);
        if (count <= 0) {
            return { success: false, message: '道具库存不足', data: { count } };
        }
        
        // 移除道具
        if (!this.removeItem(itemId)) {
            return { success: false, message: '道具移除失败', data: null };
        }
        
        // 应用效果
        const effectResult = this.applyItemEffect(itemId, item);
        
        // 触发事件
        this.emit('itemUsed', { 
            itemId, 
            effect: item.effect,
            effectResult
        });
        
        return { 
            success: true, 
            message: '使用成功',
            data: {
                itemId,
                effect: item.effect,
                effectResult,
                remaining: this.getInventoryCount(itemId)
            }
        };
    }

    /**
     * 应用道具效果
     * @param {string} itemId - 道具ID
     * @param {Object} item - 道具配置
     * @returns {Object} 效果结果
     */
    applyItemEffect(itemId, item) {
        const effect = item.effect;
        let result = { type: effect.type, applied: false };
        
        switch (effect.type) {
            case 'instant_percent':
                // 即时获得当前金币的一定百分比
                const currentGold = this.gameState.getGold();
                const goldGain = Math.floor(currentGold * effect.value);
                this.gameState.addGold(goldGain, `item_${itemId}`);
                result = {
                    type: effect.type,
                    applied: true,
                    goldGained: goldGain,
                    percentage: effect.value * 100
                };
                break;
                
            case 'gold_multiplier':
                // 金币翻倍BUFF
                this.buffManager.addBuff(itemId, item);
                result = {
                    type: effect.type,
                    applied: true,
                    multiplier: effect.value,
                    duration: item.duration
                };
                break;
                
            case 'gps_multiplier':
                // GPS加速BUFF
                this.buffManager.addBuff(itemId, item);
                result = {
                    type: effect.type,
                    applied: true,
                    multiplier: effect.value,
                    duration: item.duration
                };
                break;
                
            case 'crit_rate_add':
                // 暴击率增加BUFF
                this.buffManager.addBuff(itemId, item);
                result = {
                    type: effect.type,
                    applied: true,
                    bonus: effect.value * 100,
                    duration: item.duration
                };
                break;
                
            default:
                console.warn(`[ItemManager] Unknown effect type: ${effect.type}`);
        }
        
        return result;
    }

    /**
     * 检查是否可以购买道具
     * @param {string} itemId - 道具ID
     * @returns {boolean} 是否可以购买
     */
    canBuyItem(itemId) {
        const item = this.itemsConfig[itemId];
        if (!item || item.source !== 'shop') return false;
        
        const price = item.price || 0;
        const gold = this.gameState.getGold();
        const currentCount = this.getInventoryCount(itemId);
        const maxStack = item.maxStack || 99;
        
        return gold >= price && currentCount < maxStack;
    }

    /**
     * 购买道具
     * @param {string} itemId - 道具ID
     * @returns {Object} 购买结果 { success, message, data }
     */
    purchaseItem(itemId) {
        const item = this.itemsConfig[itemId];
        if (!item) {
            return { success: false, message: '道具不存在', data: null };
        }
        
        if (item.source !== 'shop') {
            return { success: false, message: '该道具无法购买', data: null };
        }
        
        const price = item.price || 0;
        
        // 检查库存上限
        const currentCount = this.getInventoryCount(itemId);
        const maxStack = item.maxStack || 99;
        if (currentCount >= maxStack) {
            return { success: false, message: '已达库存上限', data: { currentCount, maxStack } };
        }
        
        // 检查金币
        if (!this.gameState.spendGold(price, `purchase_item_${itemId}`)) {
            return { success: false, message: '金币不足', data: { price, gold: this.gameState.getGold() } };
        }
        
        // 添加道具
        this.addItem(itemId, 1, 'shop');
        
        // 触发事件
        this.emit('itemPurchased', { 
            itemId, 
            price,
            count: this.getInventoryCount(itemId)
        });
        
        return { 
            success: true, 
            message: '购买成功',
            data: {
                itemId,
                price,
                count: this.getInventoryCount(itemId)
            }
        };
    }

    /**
     * 获取库存信息
     * @returns {Object} 库存信息
     */
    getInventory() {
        const inventory = {};
        for (const itemId in this.gameState.playerData.inventory) {
            const count = this.gameState.playerData.inventory[itemId];
            if (count > 0) {
                inventory[itemId] = {
                    ...this.itemsConfig[itemId],
                    count
                };
            }
        }
        return inventory;
    }

    /**
     * 获取库存总数量
     * @returns {number} 库存总数量
     */
    getTotalItemCount() {
        let total = 0;
        for (const itemId in this.gameState.playerData.inventory) {
            total += this.gameState.playerData.inventory[itemId] || 0;
        }
        return total;
    }

    /**
     * 获取道具种类数量
     * @returns {number} 道具种类数量
     */
    getItemTypeCount() {
        let count = 0;
        for (const itemId in this.gameState.playerData.inventory) {
            if (this.gameState.playerData.inventory[itemId] > 0) {
                count++;
            }
        }
        return count;
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
                    console.error(`[ItemManager] Event listener error:`, e);
                }
            });
        }
    }
}

window.ItemManager = ItemManager;
