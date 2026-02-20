/**
 * ShopManager - 商店管理系统
 * 负责商品购买、价格计算、商品状态管理
 * 
 * @module ShopManager
 * @author LP -> SP-1
 * @version 1.1.0
 */

class ShopManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // 商品配置
        this.shopItems = {};
        
        // 商店状态
        this.shopState = {
            totalPurchases: 0,
            totalGoldSpent: 0
        };
        
        // 事件监听器
        this.listeners = new Map();
    }

    /**
     * 初始化商店系统
     * @param {Object} itemsConfig - 商品配置
     */
    init(itemsConfig) {
        this.shopItems = itemsConfig || {};
        
        // 初始化升级数据
        for (const itemId in this.shopItems) {
            if (!this.gameState.playerData.upgrades[itemId]) {
                this.gameState.playerData.upgrades[itemId] = { level: 0, totalSpent: 0 };
            }
        }
        
        console.log('ShopManager initialized with', Object.keys(this.shopItems).length, 'items');
    }

    /**
     * 获取商品信息
     * @param {string} itemId - 商品ID
     * @returns {Object|null} 商品信息
     */
    getItem(itemId) {
        const baseItem = this.shopItems[itemId];
        if (!baseItem) return null;
        
        const level = this.gameState.getUpgradeLevel(itemId);
        const currentPrice = this.calculatePrice(itemId);
        const status = this.getItemStatus(itemId);
        
        return {
            ...baseItem,
            level,
            currentPrice,
            status,
            canPurchase: status === 'PURCHASABLE',
            isMaxLevel: status === 'MAX_LEVEL',
            isLocked: status === 'LOCKED',
            isNotAffordable: status === 'NOT_AFFORDABLE'
        };
    }

    /**
     * 获取所有商品列表
     * @param {string} category - 分类筛选 (all, click, auto)
     * @returns {Array} 商品列表
     */
    getAllItems(category = 'all') {
        const items = [];
        for (const itemId in this.shopItems) {
            const item = this.getItem(itemId);
            if (item) {
                // 分类筛选
                if (category === 'all' || item.category === category) {
                    items.push(item);
                }
            }
        }
        
        // 按价格排序
        items.sort((a, b) => a.currentPrice - b.currentPrice);
        
        return items;
    }

    /**
     * 计算商品当前价格
     * 公式: currentPrice = Math.ceil(basePrice * Math.pow(growthRate, level))
     * @param {string} itemId - 商品ID
     * @returns {number} 当前价格
     */
    calculatePrice(itemId) {
        const baseItem = this.shopItems[itemId];
        if (!baseItem) return 0;
        
        const level = this.gameState.getUpgradeLevel(itemId);
        const price = Math.ceil(baseItem.basePrice * Math.pow(baseItem.growthRate, level));
        
        return price;
    }

    /**
     * 计算批量购买总价
     * @param {string} itemId - 商品ID
     * @param {number} count - 购买数量
     * @returns {number} 总价
     */
    calculateTotalPrice(itemId, count) {
        const baseItem = this.shopItems[itemId];
        if (!baseItem) return 0;
        
        const currentLevel = this.gameState.getUpgradeLevel(itemId);
        let total = 0;
        
        for (let i = 0; i < count; i++) {
            total += Math.ceil(baseItem.basePrice * Math.pow(baseItem.growthRate, currentLevel + i));
        }
        
        return total;
    }

    /**
     * 购买商品
     * @param {string} itemId - 商品ID
     * @returns {Object} 购买结果 { success, message, data }
     */
    purchaseItem(itemId) {
        const item = this.shopItems[itemId];
        if (!item) {
            return { success: false, message: '商品不存在', data: null };
        }
        
        // 检查解锁条件
        if (!this.checkUnlockCondition(itemId)) {
            return { success: false, message: '未满足解锁条件', data: null };
        }
        
        // 检查购买上限
        const level = this.gameState.getUpgradeLevel(itemId);
        if (item.maxLevel && level >= item.maxLevel) {
            return { success: false, message: '已达最高等级', data: null };
        }
        
        const price = this.calculatePrice(itemId);
        
        // 检查金币
        if (!this.gameState.spendGold(price, `purchase_${itemId}`)) {
            return { success: false, message: '金币不足', data: { price, gold: this.gameState.getGold() } };
        }
        
        // 更新等级
        this.gameState.upgradeItem(itemId);
        
        // 更新统计
        this.shopState.totalPurchases++;
        this.shopState.totalGoldSpent += price;
        
        // 更新玩家数据中的总花费
        if (this.gameState.playerData.upgrades[itemId]) {
            this.gameState.playerData.upgrades[itemId].totalSpent += price;
        }
        
        // 应用效果
        this.applyItemEffect(itemId, item.effect);
        
        // 触发事件
        this.emit('itemPurchased', { 
            itemId, 
            level: this.gameState.getUpgradeLevel(itemId),
            price,
            effect: item.effect
        });
        
        return { 
            success: true, 
            message: '购买成功',
            data: {
                itemId,
                newLevel: this.gameState.getUpgradeLevel(itemId),
                newPrice: this.calculatePrice(itemId)
            }
        };
    }

    /**
     * 应用商品效果
     * @param {string} itemId - 商品ID
     * @param {Object} effect - 效果配置
     */
    applyItemEffect(itemId, effect) {
        // 效果在点击系统和GPS系统中实时计算
        // 这里只记录日志，实际效果由各系统根据等级计算
        console.log(`[ShopManager] 应用效果: ${itemId}`, effect);
        
        // 触发效果变更事件，通知其他系统更新
        this.emit('effectApplied', { itemId, effect });
    }

    /**
     * 获取商品状态
     * @param {string} itemId - 商品ID
     * @returns {string} 状态 (PURCHASABLE, NOT_AFFORDABLE, MAX_LEVEL, LOCKED)
     */
    getItemStatus(itemId) {
        const item = this.shopItems[itemId];
        if (!item) return 'LOCKED';
        
        // 检查解锁条件
        if (!this.checkUnlockCondition(itemId)) {
            return 'LOCKED';
        }
        
        const level = this.gameState.getUpgradeLevel(itemId);
        
        // 检查最大等级
        if (item.maxLevel && level >= item.maxLevel) {
            return 'MAX_LEVEL';
        }
        
        const price = this.calculatePrice(itemId);
        const gold = this.gameState.getGold();
        
        // 检查金币
        if (gold < price) {
            return 'NOT_AFFORDABLE';
        }
        
        return 'PURCHASABLE';
    }

    /**
     * 检查解锁条件
     * @param {string} itemId - 商品ID
     * @returns {boolean} 是否已解锁
     */
    checkUnlockCondition(itemId) {
        const item = this.shopItems[itemId];
        if (!item) return false;
        
        // 没有解锁条件则默认解锁
        if (!item.unlockCondition) return true;
        
        const condition = item.unlockCondition;
        
        // 根据解锁条件类型检查
        if (condition.type === 'level') {
            return this.gameState.getUpgradeLevel(condition.targetId) >= condition.value;
        }
        
        if (condition.type === 'gold') {
            return this.gameState.playerData.totalGoldEarned >= condition.value;
        }
        
        if (condition.type === 'clicks') {
            return this.gameState.playerData.totalClicks >= condition.value;
        }
        
        return true;
    }

    /**
     * 获取商店统计信息
     * @returns {Object} 统计信息
     */
    getShopStats() {
        return {
            totalPurchases: this.shopState.totalPurchases,
            totalGoldSpent: this.shopState.totalGoldSpent,
            totalItems: Object.keys(this.shopItems).length,
            purchasedItems: Object.values(this.gameState.playerData.upgrades)
                .filter(u => u.level > 0).length
        };
    }

    /**
     * 获取可购买商品数量
     * @returns {number} 可购买商品数量
     */
    getAffordableCount() {
        let count = 0;
        for (const itemId in this.shopItems) {
            if (this.getItemStatus(itemId) === 'PURCHASABLE') {
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
                    console.error(`[ShopManager] Event listener error:`, e);
                }
            });
        }
    }
}

// 导出模块
window.ShopManager = ShopManager;
