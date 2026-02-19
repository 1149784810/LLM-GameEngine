/**
 * Clicker Quest - 道具管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理道具的获取、使用、效果应用、叠加规则和持续时间
 */

class ItemManager {
    constructor(eventBus, goldManager, gameData) {
        this.eventBus = eventBus;
        this.goldManager = goldManager;
        this.gameData = gameData;
        
        // 道具存储
        this.ownedItems = new Map();       // 拥有的道具
        this.activeBuffs = new Map();      // 激活的BUFF
        this.autoClickers = new Map();     // 自动点击器
        
        // BUFF更新定时器
        this.buffUpdateInterval = null;
        
        // 初始化
        this._init();
    }

    /**
     * 初始化道具管理器
     * @private
     */
    _init() {
        // 从gameData加载道具数据
        if (this.gameData && this.gameData.items) {
            this.itemsData = this.gameData.items;
        }
        
        // 启动BUFF更新循环 (每100ms更新一次)
        this.buffUpdateInterval = setInterval(() => {
            this._updateBuffs(100);
        }, 100);
        
        // 绑定事件监听
        if (this.eventBus) {
            this.eventBus.on('item:use', (data) => {
                this.useItem(data.itemId);
            });
            
            this.eventBus.on('item:add', (data) => {
                this.addItem(data.item, data.quantity);
            });
        }
        
        // 初始化全局倍率
        this.globalMultipliers = {
            gold: 1,        // 全局金币倍率
            click: 1,       // 全局点击倍率
            dps: 1          // 全局DPS倍率
        };
    }

    /**
     * 添加道具
     * @param {Object} item - 道具对象
     * @param {number} quantity - 数量
     * @returns {boolean} 是否成功
     */
    addItem(item, quantity = 1) {
        if (!item || !item.id) {
            console.error('Invalid item data');
            return false;
        }
        
        const existingItem = this.ownedItems.get(item.id);
        
        if (existingItem) {
            // 根据叠加规则处理
            this._handleStacking(existingItem, item, quantity);
        } else {
            // 新道具，直接添加
            const newItem = {
                ...item,
                quantity: quantity,
                acquiredAt: Date.now()
            };
            
            // 如果是BUFF类型道具，设置持续时间
            if (item.type === ItemType.BUFF && item.duration) {
                newItem.remainingTime = item.duration;
                newItem.startTime = Date.now();
            }
            
            this.ownedItems.set(item.id, newItem);
        }
        
        // 触发道具获取事件
        if (this.eventBus) {
            this.eventBus.emit('item:acquired', {
                itemId: item.id,
                quantity: quantity
            });
        }
        
        return true;
    }

    /**
     * 使用道具
     * @param {string} itemId - 道具ID
     * @returns {Object} 使用结果
     */
    useItem(itemId) {
        const item = this.ownedItems.get(itemId);
        
        if (!item) {
            return {
                success: false,
                error: 'ITEM_NOT_FOUND'
            };
        }
        
        // 检查道具数量
        if (item.quantity <= 0) {
            return {
                success: false,
                error: 'INSUFFICIENT_QUANTITY'
            };
        }
        
        // 执行道具效果
        this._applyItemEffect(item);
        
        // 减少道具数量
        item.quantity -= 1;
        
        // 如果数量为0，移除道具
        if (item.quantity <= 0) {
            this.ownedItems.delete(itemId);
        }
        
        // 触发使用事件
        if (this.eventBus) {
            this.eventBus.emit('item:used', {
                itemId: itemId,
                remainingQuantity: item.quantity
            });
        }
        
        return {
            success: true,
            error: null
        };
    }

    /**
     * 移除道具
     * @param {string} itemId - 道具ID
     * @param {number} quantity - 数量
     * @returns {boolean} 是否成功
     */
    removeItem(itemId, quantity = 1) {
        const item = this.ownedItems.get(itemId);
        
        if (!item) {
            return false;
        }
        
        item.quantity -= quantity;
        
        if (item.quantity <= 0) {
            this.ownedItems.delete(itemId);
            
            // 如果是激活的BUFF，也要移除
            if (this.activeBuffs.has(itemId)) {
                this.deactivateBuff(itemId);
            }
        }
        
        return true;
    }

    /**
     * 应用道具效果
     * @param {Object} item - 道具对象
     * @private
     */
    _applyItemEffect(item) {
        if (!item || !item.effects) {
            return;
        }
        
        // 根据道具类型执行不同效果
        switch (item.type) {
            case ItemType.AUTO:
                // 自动点击器：增加DPS
                this._applyAutoClicker(item);
                break;
                
            case ItemType.BUFF:
                // 增益道具：激活BUFF
                this.activateBuff(item);
                break;
                
            case ItemType.CONSUMABLE:
                // 消耗道具：即时效果
                this._applyConsumable(item);
                break;
                
            case ItemType.PERMANENT:
                // 永久加成
                this._applyPermanentBonus(item);
                break;
        }
    }
    
    /**
     * 应用自动点击器效果
     * @param {Object} item - 道具对象
     * @private
     */
    _applyAutoClicker(item) {
        if (this.autoClickers.has(item.id)) {
            // 已存在，增加数量
            const existing = this.autoClickers.get(item.id);
            existing.count += 1;
        } else {
            // 新增自动点击器
            this.autoClickers.set(item.id, {
                ...item,
                count: 1
            });
        }
        
        // 触发DPS更新事件
        if (this.eventBus) {
            this.eventBus.emit('dps:updated', {
                totalDPS: this.calculateDPSBonus()
            });
        }
    }
    
    /**
     * 应用消耗道具效果
     * @param {Object} item - 道具对象
     * @private
     */
    _applyConsumable(item) {
        if (!item.effects) {
            return;
        }
        
        item.effects.forEach(effect => {
            switch (effect.type) {
                case EffectType.INSTANT_GOLD:
                    // 立即获得金币
                    if (this.goldManager) {
                        const amount = effect.value || 0;
                        this.goldManager.addGold(amount);
                    }
                    break;
                    
                case EffectType.GUARANTEED_CRIT:
                    // 必定暴击（下次点击）
                    if (this.eventBus) {
                        this.eventBus.emit('buff:guaranteed_crit', {
                            duration: effect.duration || 5000
                        });
                    }
                    break;
            }
        });
    }
    
    /**
     * 应用永久加成
     * @param {Object} item - 道具对象
     * @private
     */
    _applyPermanentBonus(item) {
        if (!item.effects) {
            return;
        }
        
        item.effects.forEach(effect => {
            switch (effect.type) {
                case EffectType.GOLD_MULTIPLIER:
                    this.globalMultipliers.gold *= (1 + effect.value);
                    break;
                    
                case EffectType.DPS_BOOST:
                    this.globalMultipliers.dps *= (1 + effect.value);
                    break;
            }
        });
        
        // 触发倍率更新事件
        if (this.eventBus) {
            this.eventBus.emit('multiplier:updated', this.globalMultipliers);
        }
    }

    /**
     * 处理道具叠加
     * @param {Object} existingItem - 已有道具
     * @param {Object} newItem - 新道具
     * @param {number} quantity - 数量
     * @private
     */
    _handleStacking(existingItem, newItem, quantity = 1) {
        const stackType = existingItem.stackType || StackType.NON_STACKABLE;
        
        switch (stackType) {
            case StackType.STACKABLE:
                // 可叠加：时长相加，数量增加
                existingItem.quantity += quantity;
                if (existingItem.remainingTime !== undefined) {
                    existingItem.remainingTime += (newItem.duration || 0) * quantity;
                }
                break;
                
            case StackType.REFRESH:
                // 刷新叠加：重置时长，数量增加
                existingItem.quantity += quantity;
                existingItem.remainingTime = newItem.duration || existingItem.duration;
                existingItem.startTime = Date.now();
                break;
                
            case StackType.CAP:
                // 上限叠加：有上限的叠加
                const maxStack = existingItem.maxStack || 10;
                existingItem.quantity = Math.min(existingItem.quantity + quantity, maxStack);
                if (existingItem.remainingTime !== undefined) {
                    existingItem.remainingTime = Math.min(
                        existingItem.remainingTime + (newItem.duration || 0) * quantity,
                        (newItem.duration || existingItem.duration) * maxStack
                    );
                }
                break;
                
            case StackType.NON_STACKABLE:
            default:
                // 不可叠加：独立存在，不处理
                console.log(`Item ${existingItem.id} is non-stackable`);
                break;
        }
        
        // 触发叠加事件
        if (this.eventBus) {
            this.eventBus.emit('item:stacked', {
                itemId: existingItem.id,
                stackType: stackType,
                newQuantity: existingItem.quantity
            });
        }
    }

    /**
     * 更新BUFF状态
     * @param {number} deltaTime - 时间增量（毫秒）
     * @private
     */
    _updateBuffs(deltaTime) {
        const expiredBuffs = [];
        
        // 遍历所有激活的BUFF
        this.activeBuffs.forEach((buff, buffId) => {
            // 减少剩余时间
            if (buff.remainingTime !== undefined) {
                buff.remainingTime -= deltaTime;
                
                // 检查是否过期
                if (buff.remainingTime <= 0) {
                    expiredBuffs.push(buffId);
                }
            }
        });
        
        // 移除过期BUFF
        expiredBuffs.forEach(buffId => {
            this.deactivateBuff(buffId);
        });
        
        // 触发BUFF更新事件
        if (expiredBuffs.length > 0 && this.eventBus) {
            this.eventBus.emit('buff:expired', {
                expiredBuffs: expiredBuffs,
                activeBuffs: this.getActiveBuffs()
            });
            
            // 触发倍率更新
            this.eventBus.emit('multiplier:updated', {
                gold: this.calculateGoldMultiplier(),
                click: this.calculateClickMultiplier(),
                dps: this.calculateDPSBonus()
            });
        }
    }

    /**
     * 激活BUFF
     * @param {Object} buff - BUFF对象
     */
    activateBuff(buff) {
        if (!buff || !buff.id) {
            return;
        }
        
        // 检查是否已激活
        const existingBuff = this.activeBuffs.get(buff.id);
        
        if (existingBuff) {
            // 根据叠加规则处理
            this._handleBuffStacking(existingBuff, buff);
        } else {
            // 新激活BUFF
            const newBuff = {
                ...buff,
                remainingTime: buff.duration || 0,
                startTime: Date.now(),
                stackCount: 1
            };
            
            this.activeBuffs.set(buff.id, newBuff);
        }
        
        // 触发BUFF激活事件
        if (this.eventBus) {
            this.eventBus.emit('buff:activated', {
                buffId: buff.id,
                activeBuffs: this.getActiveBuffs()
            });
            
            // 触发倍率更新
            this.eventBus.emit('multiplier:updated', {
                gold: this.calculateGoldMultiplier(),
                click: this.calculateClickMultiplier(),
                dps: this.calculateDPSBonus()
            });
        }
    }
    
    /**
     * 处理BUFF叠加
     * @param {Object} existingBuff - 已有BUFF
     * @param {Object} newBuff - 新BUFF
     * @private
     */
    _handleBuffStacking(existingBuff, newBuff) {
        const stackType = existingBuff.stackType || StackType.REFRESH;
        
        switch (stackType) {
            case StackType.STACKABLE:
                // 可叠加：时长相加，叠加层数增加
                existingBuff.stackCount += 1;
                existingBuff.remainingTime += newBuff.duration || 0;
                break;
                
            case StackType.REFRESH:
                // 刷新叠加：重置时长
                existingBuff.remainingTime = newBuff.duration || existingBuff.duration;
                existingBuff.startTime = Date.now();
                break;
                
            case StackType.CAP:
                // 上限叠加：有上限的叠加
                const maxStack = existingBuff.maxStack || 5;
                existingBuff.stackCount = Math.min(existingBuff.stackCount + 1, maxStack);
                existingBuff.remainingTime = Math.min(
                    existingBuff.remainingTime + (newBuff.duration || 0),
                    (newBuff.duration || existingBuff.duration) * maxStack
                );
                break;
                
            case StackType.NON_STACKABLE:
            default:
                // 不可叠加：仅刷新时间
                existingBuff.remainingTime = Math.max(
                    existingBuff.remainingTime,
                    newBuff.duration || 0
                );
                break;
        }
    }

    /**
     * 停用BUFF
     * @param {string} buffId - BUFF ID
     */
    deactivateBuff(buffId) {
        const buff = this.activeBuffs.get(buffId);
        
        if (!buff) {
            return;
        }
        
        // 从激活列表中移除
        this.activeBuffs.delete(buffId);
        
        // 触发BUFF停用事件
        if (this.eventBus) {
            this.eventBus.emit('buff:deactivated', {
                buffId: buffId,
                activeBuffs: this.getActiveBuffs()
            });
            
            // 触发倍率更新
            this.eventBus.emit('multiplier:updated', {
                gold: this.calculateGoldMultiplier(),
                click: this.calculateClickMultiplier(),
                dps: this.calculateDPSBonus()
            });
        }
    }

    /**
     * 获取激活的BUFF列表
     * @returns {Array} BUFF列表
     */
    getActiveBuffs() {
        return Array.from(this.activeBuffs.values());
    }

    /**
     * 获取拥有的道具列表
     * @param {string} type - 道具类型（可选）
     * @returns {Array} 道具列表
     */
    getOwnedItems(type = null) {
        const items = Array.from(this.ownedItems.values());
        
        if (type) {
            return items.filter(item => item.type === type);
        }
        
        return items;
    }

    /**
     * 获取自动点击器列表
     * @returns {Array} 自动点击器列表
     */
    getAutoClickers() {
        return Array.from(this.autoClickers.values());
    }

    /**
     * 计算总DPS加成
     * @returns {number} DPS加成
     */
    calculateDPSBonus() {
        let totalDPS = 0;
        
        // 计算自动点击器的DPS
        this.autoClickers.forEach(autoClicker => {
            const baseDPS = autoClicker.dps || 0;
            const count = autoClicker.count || 1;
            totalDPS += baseDPS * count;
        });
        
        // 计算BUFF的DPS加成
        this.activeBuffs.forEach(buff => {
            if (buff.effects) {
                buff.effects.forEach(effect => {
                    if (effect.type === EffectType.DPS_BOOST) {
                        const stackCount = buff.stackCount || 1;
                        totalDPS *= (1 + effect.value * stackCount);
                    }
                });
            }
        });
        
        // 应用全局DPS倍率
        totalDPS *= this.globalMultipliers.dps;
        
        return totalDPS;
    }

    /**
     * 计算点击倍率加成
     * @returns {number} 点击倍率
     */
    calculateClickMultiplier() {
        let multiplier = 1;
        
        // 计算BUFF的点击倍率加成
        this.activeBuffs.forEach(buff => {
            if (buff.effects) {
                buff.effects.forEach(effect => {
                    if (effect.type === EffectType.GOLD_MULTIPLIER) {
                        const stackCount = buff.stackCount || 1;
                        // 加法叠加
                        multiplier += effect.value * stackCount;
                    }
                });
            }
        });
        
        // 应用全局金币倍率
        multiplier *= this.globalMultipliers.gold;
        
        return multiplier;
    }
    
    /**
     * 计算金币倍率
     * @returns {number} 金币倍率
     */
    calculateGoldMultiplier() {
        return this.calculateClickMultiplier();
    }

    /**
     * 计算暴击率加成
     * @returns {number} 暴击率加成（百分比）
     */
    calculateCritRateBonus() {
        let critRateBonus = 0;
        
        // 计算BUFF的暴击率加成
        this.activeBuffs.forEach(buff => {
            if (buff.effects) {
                buff.effects.forEach(effect => {
                    if (effect.type === EffectType.CRIT_RATE) {
                        const stackCount = buff.stackCount || 1;
                        critRateBonus += effect.value * stackCount;
                    }
                });
            }
        });
        
        return critRateBonus;
    }

    /**
     * 检查是否拥有道具
     * @param {string} itemId - 道具ID
     * @returns {boolean} 是否拥有
     */
    hasItem(itemId) {
        return this.ownedItems.has(itemId);
    }

    /**
     * 获取道具数量
     * @param {string} itemId - 道具ID
     * @returns {number} 数量
     */
    getItemQuantity(itemId) {
        const item = this.ownedItems.get(itemId);
        return item ? item.quantity : 0;
    }

    /**
     * 获取存档数据
     * @returns {Object} 道具数据
     */
    getSaveData() {
        return {
            ownedItems: Array.from(this.ownedItems.entries()),
            activeBuffs: Array.from(this.activeBuffs.entries()),
            autoClickers: Array.from(this.autoClickers.entries()),
            globalMultipliers: this.globalMultipliers
        };
    }

    /**
     * 从存档数据恢复
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) {
            return;
        }
        
        // 恢复拥有的道具
        if (data.ownedItems) {
            this.ownedItems = new Map(data.ownedItems);
        }
        
        // 恢复激活的BUFF
        if (data.activeBuffs) {
            this.activeBuffs = new Map(data.activeBuffs);
        }
        
        // 恢复自动点击器
        if (data.autoClickers) {
            this.autoClickers = new Map(data.autoClickers);
        }
        
        // 恢复全局倍率
        if (data.globalMultipliers) {
            this.globalMultipliers = data.globalMultipliers;
        }
    }

    /**
     * 销毁道具管理器
     */
    destroy() {
        // 清理定时器
        if (this.buffUpdateInterval) {
            clearInterval(this.buffUpdateInterval);
            this.buffUpdateInterval = null;
        }
        
        // 移除事件监听
        if (this.eventBus) {
            this.eventBus.off('item:use');
            this.eventBus.off('item:add');
        }
        
        // 清空数据
        this.ownedItems.clear();
        this.activeBuffs.clear();
        this.autoClickers.clear();
    }
}

// 道具类型枚举
const ItemType = {
    AUTO: 'AUTO',              // 自动点击器
    BUFF: 'BUFF',              // 增益道具
    CONSUMABLE: 'CONSUMABLE',  // 消耗道具
    PERMANENT: 'PERMANENT'     // 永久道具
};

// 叠加类型枚举
const StackType = {
    STACKABLE: 'STACKABLE',       // 可叠加
    REFRESH: 'REFRESH',           // 刷新时长
    CAP: 'CAP',                   // 上限叠加
    NON_STACKABLE: 'NON_STACKABLE' // 不可叠加
};

// 效果类型枚举
const EffectType = {
    GOLD_MULTIPLIER: 'GOLD_MULTIPLIER',    // 金币倍率
    CRIT_RATE: 'CRIT_RATE',                // 暴击率
    DPS_BOOST: 'DPS_BOOST',                // DPS提升
    INSTANT_GOLD: 'INSTANT_GOLD',          // 立即获得金币
    GUARANTEED_CRIT: 'GUARANTEED_CRIT',    // 必定暴击
    OFFLINE_REWARD: 'OFFLINE_REWARD'       // 离线收益
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ItemManager, ItemType, StackType, EffectType };
} else {
    window.ItemManager = ItemManager;
    window.ItemType = ItemType;
    window.StackType = StackType;
    window.EffectType = EffectType;
}
