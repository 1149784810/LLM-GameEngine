/**
 * Clicker Quest - 商店管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理商店商品展示、购买流程、购买限制和商店刷新
 */

class ShopManager {
    constructor(eventBus, goldManager, itemManager, gameData) {
        this.eventBus = eventBus;
        this.goldManager = goldManager;
        this.itemManager = itemManager;
        this.gameData = gameData;
        
        // 商品列表
        this.items = [];
        this.categories = ['全部', '自动', '增益', '消耗品', '永久'];
        this.currentCategory = '全部';
        
        // 刷新状态
        this.freeRefreshCount = 3;
        this.maxFreeRefresh = 3;
        this.lastRefreshTime = 0;
        
        // 购买记录
        this.purchaseRecords = new Map(); // itemId -> { boughtCount, lastBuyTime, dailyBoughtCount, lastResetTime }
        
        // 初始化
        this._init();
    }

    /**
     * 初始化商店管理器
     * @private
     */
    _init() {
        // 加载商品数据
        this._loadShopItems();
        // 绑定事件监听
        this._bindEvents();
    }

    /**
     * 加载商店商品数据
     * @private
     */
    _loadShopItems() {
        // 从gameData加载商品配置
        if (this.gameData && this.gameData.shopItems) {
            this.items = this.gameData.shopItems;
        } else {
            // 默认商品配置
            this.items = this._getDefaultShopItems();
        }
    }

    /**
     * 获取默认商品配置
     * @private
     */
    _getDefaultShopItems() {
        return [
            // 自动点击器
            {
                itemId: 'item_auto_001',
                itemName: '初级自动点击器',
                itemDesc: '1金币/秒',
                itemIcon: 'icon_auto_001',
                itemRarity: 'common',
                itemType: 'AUTO',
                category: '自动',
                basePrice: 100,
                priceGrowth: 1.15,
                currency: 'gold',
                buyLimit: 0, // 0表示无限
                unlockLevel: 1,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 0,
                effect: {
                    type: 'DPS_BOOST',
                    value: 1,
                    duration: 0
                }
            },
            {
                itemId: 'item_auto_002',
                itemName: '中级自动点击器',
                itemDesc: '5金币/秒',
                itemIcon: 'icon_auto_002',
                itemRarity: 'rare',
                itemType: 'AUTO',
                category: '自动',
                basePrice: 500,
                priceGrowth: 1.15,
                currency: 'gold',
                buyLimit: 0,
                unlockLevel: 5,
                unlockItem: 'item_auto_001',
                unlockAchievement: null,
                cooldown: 0,
                effect: {
                    type: 'DPS_BOOST',
                    value: 5,
                    duration: 0
                }
            },
            {
                itemId: 'item_auto_003',
                itemName: '高级自动点击器',
                itemDesc: '25金币/秒',
                itemIcon: 'icon_auto_003',
                itemRarity: 'epic',
                itemType: 'AUTO',
                category: '自动',
                basePrice: 2000,
                priceGrowth: 1.15,
                currency: 'gold',
                buyLimit: 0,
                unlockLevel: 10,
                unlockItem: 'item_auto_002',
                unlockAchievement: null,
                cooldown: 0,
                effect: {
                    type: 'DPS_BOOST',
                    value: 25,
                    duration: 0
                }
            },
            // 增益道具
            {
                itemId: 'item_buff_gold_2x_30s',
                itemName: '金币翻倍(小)',
                itemDesc: '金币获取x2，持续30秒',
                itemIcon: 'icon_buff_gold',
                itemRarity: 'rare',
                itemType: 'BUFF',
                category: '增益',
                basePrice: 1000,
                priceGrowth: 1,
                currency: 'gold',
                buyLimit: 0,
                unlockLevel: 1,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 30,
                effect: {
                    type: 'GOLD_MULTIPLIER',
                    value: 2,
                    duration: 30
                }
            },
            {
                itemId: 'item_buff_gold_2x_60s',
                itemName: '金币翻倍(中)',
                itemDesc: '金币获取x2，持续60秒',
                itemIcon: 'icon_buff_gold',
                itemRarity: 'rare',
                itemType: 'BUFF',
                category: '增益',
                basePrice: 2500,
                priceGrowth: 1,
                currency: 'gold',
                buyLimit: 0,
                unlockLevel: 5,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 30,
                effect: {
                    type: 'GOLD_MULTIPLIER',
                    value: 2,
                    duration: 60
                }
            },
            {
                itemId: 'item_buff_luck_10',
                itemName: '幸运药水(小)',
                itemDesc: '暴击率+10%，持续60秒',
                itemIcon: 'icon_buff_luck',
                itemRarity: 'rare',
                itemType: 'BUFF',
                category: '增益',
                basePrice: 500,
                priceGrowth: 1,
                currency: 'gold',
                buyLimit: 0,
                unlockLevel: 1,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 30,
                effect: {
                    type: 'CRIT_RATE',
                    value: 10,
                    duration: 60
                }
            },
            {
                itemId: 'item_buff_speed_2x',
                itemName: '时间加速(小)',
                itemDesc: '自动点击器效率x2，持续60秒',
                itemIcon: 'icon_buff_speed',
                itemRarity: 'epic',
                itemType: 'BUFF',
                category: '增益',
                basePrice: 800,
                priceGrowth: 1,
                currency: 'gold',
                buyLimit: 0,
                unlockLevel: 3,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 60,
                effect: {
                    type: 'DPS_BOOST',
                    value: 2,
                    duration: 60,
                    isMultiplier: true
                }
            },
            // 消耗道具
            {
                itemId: 'item_consum_gold_100',
                itemName: '金币礼包(小)',
                itemDesc: '立即获得100金币',
                itemIcon: 'icon_gold_pack',
                itemRarity: 'common',
                itemType: 'CONSUMABLE',
                category: '消耗品',
                basePrice: 0,
                priceGrowth: 1,
                currency: 'gold',
                buyLimit: 1,
                unlockLevel: 1,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 0,
                effect: {
                    type: 'INSTANT_GOLD',
                    value: 100,
                    duration: 0
                }
            },
            // 永久道具
            {
                itemId: 'item_perm_click_1',
                itemName: '点击强化(小)',
                itemDesc: '永久点击金币+1',
                itemIcon: 'icon_click_upgrade',
                itemRarity: 'rare',
                itemType: 'PERMANENT',
                category: '永久',
                basePrice: 500,
                priceGrowth: 1,
                currency: 'gold',
                buyLimit: 0,
                unlockLevel: 1,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 0,
                effect: {
                    type: 'CLICK_GOLD_ADD',
                    value: 1,
                    duration: 0
                }
            },
            {
                itemId: 'item_perm_crit_1',
                itemName: '暴击强化(小)',
                itemDesc: '永久暴击倍率+0.5x',
                itemIcon: 'icon_crit_upgrade',
                itemRarity: 'epic',
                itemType: 'PERMANENT',
                category: '永久',
                basePrice: 1000,
                priceGrowth: 1,
                currency: 'gold',
                buyLimit: 10,
                unlockLevel: 5,
                unlockItem: null,
                unlockAchievement: null,
                cooldown: 0,
                effect: {
                    type: 'CRIT_MULT_ADD',
                    value: 0.5,
                    duration: 0
                }
            }
        ];
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEvents() {
        if (!this.eventBus) return;
        
        // 监听金币变化事件，更新商品状态
        this.eventBus.on('gold:changed', () => {
            this._updateItemsStatus();
        });
    }

    /**
     * 更新商品状态
     * @private
     */
    _updateItemsStatus() {
        // 触发商店更新事件
        if (this.eventBus) {
            this.eventBus.emit('shop:itemsUpdated', { items: this.items });
        }
    }

    /**
     * 获取商品列表
     * @param {string} category - 商品分类（可选）
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     * @returns {Object} 商品列表数据
     */
    getShopItems(category = null, page = 1, pageSize = 20) {
        let filteredItems = this.items;
        
        // 根据分类筛选
        if (category && category !== '全部') {
            filteredItems = this.items.filter(item => item.category === category);
        }
        
        // 检查购买条件并添加状态信息
        const itemsWithStatus = filteredItems.map(item => {
            const checkResult = this.checkPurchaseConditions(item);
            const currentPrice = this.calculatePrice(item);
            
            return {
                ...item,
                currentPrice: currentPrice,
                canBuy: checkResult.canBuy,
                reason: checkResult.reason,
                boughtCount: this._getBoughtCount(item.itemId),
                remainingBuyCount: item.buyLimit > 0 ? Math.max(0, item.buyLimit - this._getBoughtCount(item.itemId)) : -1
            };
        });
        
        // 分页处理
        const total = itemsWithStatus.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedItems = itemsWithStatus.slice(startIndex, endIndex);
        
        return {
            items: paginatedItems,
            total: total,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    }

    /**
     * 获取商品详情
     * @param {string} itemId - 商品ID
     * @returns {Object|null} 商品详情
     */
    getItemDetail(itemId) {
        const item = this.items.find(i => i.itemId === itemId);
        if (!item) {
            return null;
        }
        
        const checkResult = this.checkPurchaseConditions(item);
        const currentPrice = this.calculatePrice(item);
        const boughtCount = this._getBoughtCount(itemId);
        
        return {
            ...item,
            currentPrice: currentPrice,
            canBuy: checkResult.canBuy,
            reason: checkResult.reason,
            boughtCount: boughtCount,
            remainingBuyCount: item.buyLimit > 0 ? Math.max(0, item.buyLimit - boughtCount) : -1,
            nextLevelEffect: this._getNextLevelEffect(item),
            currentLevel: item.itemType === 'AUTO' ? boughtCount : 0
        };
    }

    /**
     * 获取下一级效果描述
     * @private
     */
    _getNextLevelEffect(item) {
        if (item.itemType === 'AUTO') {
            return `${item.effect.value}金币/秒`;
        }
        return null;
    }

    /**
     * 购买商品
     * @param {string} itemId - 商品ID
     * @param {number} quantity - 购买数量
     * @returns {Object} 购买结果
     */
    buyItem(itemId, quantity = 1) {
        // 1. 检查商品是否存在
        const item = this.items.find(i => i.itemId === itemId);
        if (!item) {
            return {
                success: false,
                error: PurchaseResult.ITEM_NOT_AVAILABLE,
                message: '商品不存在'
            };
        }
        
        // 2. 检查购买条件
        const checkResult = this.checkPurchaseConditions(item);
        if (!checkResult.canBuy) {
            return {
                success: false,
                error: checkResult.error,
                message: checkResult.reason
            };
        }
        
        // 3. 计算总价
        const totalPrice = this.calculatePrice(item, quantity);
        
        // 4. 扣除金币
        if (!this.goldManager.spendGold(totalPrice, 'buy_item')) {
            return {
                success: false,
                error: PurchaseResult.INSUFFICIENT_GOLD,
                message: '金币不足'
            };
        }
        
        // 5. 执行商品效果
        const effectResult = this._executeItemEffect(item, quantity);
        if (!effectResult.success) {
            // 回滚金币
            this.goldManager.addGold(totalPrice, 'refund');
            return {
                success: false,
                error: effectResult.error,
                message: effectResult.message
            };
        }
        
        // 6. 更新购买次数
        this._updateBoughtCount(itemId);
        
        // 7. 触发购买事件
        if (this.eventBus) {
            this.eventBus.emit('item:purchased', {
                itemId: itemId,
                itemName: item.itemName,
                quantity: quantity,
                costGold: totalPrice,
                effect: item.effect,
                timestamp: Date.now()
            });
        }
        
        // 8. 返回购买结果
        return {
            success: true,
            error: null,
            message: '购买成功',
            data: {
                itemId: itemId,
                itemName: item.itemName,
                quantity: quantity,
                costGold: totalPrice,
                remainingGold: this.goldManager.getCurrentGold(),
                effect: item.effect,
                boughtCount: this._getBoughtCount(itemId),
                timestamp: Date.now()
            }
        };
    }

    /**
     * 检查购买条件
     * @param {Object} item - 商品对象
     * @returns {Object} 检查结果
     */
    checkPurchaseConditions(item) {
        // 检查金币数量
        const price = this.calculatePrice(item);
        const currentGold = this.goldManager.getCurrentGold();
        if (currentGold < price) {
            return {
                canBuy: false,
                error: PurchaseResult.INSUFFICIENT_GOLD,
                reason: `金币不足！还需要 ${this.goldManager.formatGold(price - currentGold)} 金币`
            };
        }
        
        // 检查购买次数限制
        const boughtCount = this._getBoughtCount(item.itemId);
        if (item.buyLimit > 0 && boughtCount >= item.buyLimit) {
            return {
                canBuy: false,
                error: PurchaseResult.PURCHASE_LIMIT_REACHED,
                reason: '该道具购买次数已达上限'
            };
        }
        
        // 检查等级限制
        const playerLevel = this._getPlayerLevel();
        if (item.unlockLevel > 0 && playerLevel < item.unlockLevel) {
            return {
                canBuy: false,
                error: PurchaseResult.LEVEL_NOT_ENOUGH,
                reason: `需要 ${item.unlockLevel} 级才能购买，当前等级: ${playerLevel}级`
            };
        }
        
        // 检查前置道具
        if (item.unlockItem && !this._hasItem(item.unlockItem)) {
            const prerequisiteItem = this.items.find(i => i.itemId === item.unlockItem);
            const prerequisiteName = prerequisiteItem ? prerequisiteItem.itemName : item.unlockItem;
            return {
                canBuy: false,
                error: PurchaseResult.PREREQUISITE_NOT_MET,
                reason: `需要先购买 ${prerequisiteName}`
            };
        }
        
        // 检查成就解锁
        if (item.unlockAchievement && !this._hasAchievement(item.unlockAchievement)) {
            return {
                canBuy: false,
                error: PurchaseResult.ACHIEVEMENT_NOT_UNLOCKED,
                reason: `需要完成成就: ${item.unlockAchievement}`
            };
        }
        
        // 检查冷却时间
        if (item.cooldown > 0) {
            const lastBuyTime = this._getLastBuyTime(item.itemId);
            const currentTime = Date.now();
            const elapsedSeconds = (currentTime - lastBuyTime) / 1000;
            
            if (elapsedSeconds < item.cooldown) {
                const remainingSeconds = Math.ceil(item.cooldown - elapsedSeconds);
                return {
                    canBuy: false,
                    error: PurchaseResult.COOLDOWN_ACTIVE,
                    reason: `冷却中: ${remainingSeconds}秒`
                };
            }
        }
        
        return {
            canBuy: true,
            error: null,
            reason: ''
        };
    }

    /**
     * 计算商品价格
     * @param {Object} item - 商品对象
     * @param {number} quantity - 购买数量
     * @returns {number} 总价格
     */
    calculatePrice(item, quantity = 1) {
        if (!item.priceGrowth || item.priceGrowth === 1) {
            return item.basePrice * quantity;
        }
        
        // 根据购买次数计算价格（适用于自动点击器等）
        const boughtCount = this._getBoughtCount(item.itemId);
        let totalPrice = 0;
        
        for (let i = 0; i < quantity; i++) {
            const price = Math.floor(item.basePrice * Math.pow(item.priceGrowth, boughtCount + i));
            totalPrice += price;
        }
        
        // 设置价格上限
        const maxPrice = 1e12; // 1万亿
        return Math.min(totalPrice, maxPrice);
    }

    /**
     * 执行商品效果
     * @param {Object} item - 商品对象
     * @param {number} quantity - 购买数量
     * @returns {Object} 执行结果
     * @private
     */
    _executeItemEffect(item, quantity = 1) {
        const effect = item.effect;
        
        switch (item.itemType) {
            case 'AUTO':
                return this._executeAutoEffect(item, quantity);
            case 'BUFF':
                return this._executeBuffEffect(item, quantity);
            case 'CONSUMABLE':
                return this._executeConsumableEffect(item, quantity);
            case 'PERMANENT':
                return this._executePermanentEffect(item, quantity);
            default:
                return {
                    success: false,
                    error: 'UNKNOWN_ITEM_TYPE',
                    message: '未知道具类型'
                };
        }
    }

    /**
     * 执行AUTO类型商品效果（增加DPS）
     * @private
     */
    _executeAutoEffect(item, quantity) {
        if (!this.itemManager) {
            return {
                success: false,
                error: 'ITEM_MANAGER_NOT_FOUND',
                message: '道具管理器未初始化'
            };
        }
        
        // 添加自动点击器
        for (let i = 0; i < quantity; i++) {
            this.itemManager.addItem({
                itemId: item.itemId,
                itemName: item.itemName,
                itemType: 'AUTO',
                effect: item.effect,
                quantity: 1
            });
        }
        
        return {
            success: true,
            message: `成功添加 ${quantity} 个${item.itemName}`
        };
    }

    /**
     * 执行BUFF类型商品效果（激活增益效果）
     * @private
     */
    _executeBuffEffect(item, quantity) {
        if (!this.itemManager) {
            return {
                success: false,
                error: 'ITEM_MANAGER_NOT_FOUND',
                message: '道具管理器未初始化'
            };
        }
        
        // 添加BUFF道具
        this.itemManager.addItem({
            itemId: item.itemId,
            itemName: item.itemName,
            itemType: 'BUFF',
            effect: item.effect,
            duration: item.effect.duration,
            quantity: quantity
        });
        
        return {
            success: true,
            message: `成功激活 ${item.itemName}`
        };
    }

    /**
     * 执行CONSUMABLE类型商品效果（即时效果）
     * @private
     */
    _executeConsumableEffect(item, quantity) {
        const effect = item.effect;
        
        switch (effect.type) {
            case 'INSTANT_GOLD':
                // 立即获得金币
                const goldAmount = effect.value * quantity;
                this.goldManager.addGold(goldAmount, 'consumable_item');
                return {
                    success: true,
                    message: `成功获得 ${this.goldManager.formatGold(goldAmount)} 金币`
                };
            default:
                return {
                    success: false,
                    error: 'UNKNOWN_EFFECT_TYPE',
                    message: '未知效果类型'
                };
        }
    }

    /**
     * 执行PERMANENT类型商品效果（永久加成）
     * @private
     */
    _executePermanentEffect(item, quantity) {
        if (!this.itemManager) {
            return {
                success: false,
                error: 'ITEM_MANAGER_NOT_FOUND',
                message: '道具管理器未初始化'
            };
        }
        
        // 添加永久道具
        this.itemManager.addItem({
            itemId: item.itemId,
            itemName: item.itemName,
            itemType: 'PERMANENT',
            effect: item.effect,
            quantity: quantity
        });
        
        return {
            success: true,
            message: `成功获得永久效果: ${item.itemDesc}`
        };
    }

    /**
     * 获取已购买次数
     * @param {string} itemId - 商品ID
     * @returns {number} 已购买次数
     * @private
     */
    _getBoughtCount(itemId) {
        const record = this.purchaseRecords.get(itemId);
        return record ? record.boughtCount : 0;
    }

    /**
     * 获取上次购买时间
     * @param {string} itemId - 商品ID
     * @returns {number} 上次购买时间戳
     * @private
     */
    _getLastBuyTime(itemId) {
        const record = this.purchaseRecords.get(itemId);
        return record ? record.lastBuyTime : 0;
    }

    /**
     * 更新购买次数
     * @param {string} itemId - 商品ID
     * @private
     */
    _updateBoughtCount(itemId) {
        let record = this.purchaseRecords.get(itemId);
        
        if (!record) {
            record = {
                boughtCount: 0,
                lastBuyTime: 0,
                dailyBoughtCount: 0,
                lastResetTime: Date.now()
            };
        }
        
        record.boughtCount++;
        record.lastBuyTime = Date.now();
        record.dailyBoughtCount++;
        
        this.purchaseRecords.set(itemId, record);
    }

    /**
     * 获取玩家等级
     * @returns {number} 玩家等级
     * @private
     */
    _getPlayerLevel() {
        // 从gameData获取玩家等级
        if (this.gameData && this.gameData.playerLevel) {
            return this.gameData.playerLevel;
        }
        return 1; // 默认1级
    }

    /**
     * 检查是否拥有道具
     * @param {string} itemId - 道具ID
     * @returns {boolean} 是否拥有
     * @private
     */
    _hasItem(itemId) {
        if (!this.itemManager) {
            return false;
        }
        return this.itemManager.hasItem(itemId);
    }

    /**
     * 检查是否完成成就
     * @param {string} achievementId - 成就ID
     * @returns {boolean} 是否完成
     * @private
     */
    _hasAchievement(achievementId) {
        // TODO: 从成就管理器检查
        if (this.gameData && this.gameData.achievements) {
            return this.gameData.achievements.includes(achievementId);
        }
        return false;
    }

    /**
     * 刷新商店
     * @param {boolean} useFreeRefresh - 是否使用免费刷新
     * @returns {Object} 刷新结果
     */
    refreshShop(useFreeRefresh = true) {
        // 检查刷新条件
        if (useFreeRefresh) {
            if (this.freeRefreshCount <= 0) {
                return {
                    success: false,
                    newItems: [],
                    error: 'NO_FREE_REFRESH',
                    message: '免费刷新次数已用完'
                };
            }
            this.freeRefreshCount--;
        }
        
        // 生成新商品列表
        const newItems = this._generateNewItems();
        
        // 更新刷新时间
        this.lastRefreshTime = Date.now();
        
        // 触发刷新事件
        if (this.eventBus) {
            this.eventBus.emit('shop:refreshed', {
                newItems: newItems,
                freeRefreshCount: this.freeRefreshCount,
                timestamp: this.lastRefreshTime
            });
        }
        
        return {
            success: true,
            newItems: newItems,
            error: null,
            message: '商店刷新成功',
            freeRefreshCount: this.freeRefreshCount
        };
    }

    /**
     * 生成新商品
     * @returns {Array} 新商品列表
     * @private
     */
    _generateNewItems() {
        // 简单实现：返回随机选择的商品
        const shuffled = [...this.items].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 6);
    }

    /**
     * 设置当前分类
     * @param {string} category - 分类名称
     */
    setCategory(category) {
        this.currentCategory = category;
        
        if (this.eventBus) {
            this.eventBus.emit('shop:categoryChanged', { category: category });
        }
    }

    /**
     * 获取免费刷新次数
     * @returns {number} 免费刷新次数
     */
    getFreeRefreshCount() {
        return this.freeRefreshCount;
    }

    /**
     * 重置免费刷新次数
     */
    resetFreeRefreshCount() {
        this.freeRefreshCount = this.maxFreeRefresh;
        
        if (this.eventBus) {
            this.eventBus.emit('shop:freeRefreshReset', {
                freeRefreshCount: this.freeRefreshCount
            });
        }
    }

    /**
     * 获取存档数据
     * @returns {Object} 商店数据
     */
    getSaveData() {
        return {
            freeRefreshCount: this.freeRefreshCount,
            lastRefreshTime: this.lastRefreshTime,
            purchaseRecords: Array.from(this.purchaseRecords.entries())
        };
    }

    /**
     * 从存档数据恢复
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) return;
        
        if (data.freeRefreshCount !== undefined) {
            this.freeRefreshCount = data.freeRefreshCount;
        }
        
        if (data.lastRefreshTime !== undefined) {
            this.lastRefreshTime = data.lastRefreshTime;
        }
        
        if (data.purchaseRecords) {
            this.purchaseRecords = new Map(data.purchaseRecords);
        }
    }
}

// 购买结果枚举
const PurchaseResult = {
    SUCCESS: 'success',
    INSUFFICIENT_GOLD: 'insufficient_gold',
    PURCHASE_LIMIT_REACHED: 'purchase_limit_reached',
    LEVEL_NOT_ENOUGH: 'level_not_enough',
    PREREQUISITE_NOT_MET: 'prerequisite_not_met',
    ACHIEVEMENT_NOT_UNLOCKED: 'achievement_not_unlocked',
    COOLDOWN_ACTIVE: 'cooldown_active',
    ITEM_NOT_AVAILABLE: 'item_not_available'
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShopManager, PurchaseResult };
} else {
    window.ShopManager = ShopManager;
    window.PurchaseResult = PurchaseResult;
}
